import { createError, defineEventHandler, readBody } from 'h3';
import { findValidVisitorSession, toPublicVisitor, updateVisitorNickname } from '../../repositories/visitorRepository';
import { createNickname, getSessionToken, hashSessionToken } from '../../utils/visitorSession';

type NicknameBody = { nickname?: unknown };

function validateNickname(value: unknown) {
  // 不传 nickname 时代表“换一个系统生成的昵称”。
  if (value === undefined) return createNickname();
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'nickname must be a string.' });
  }

  const nickname = value.trim();
  // 控制字符可能破坏日志、页面显示或下游文本处理，因此拒绝保存。
  const containsControlCharacter = Array.from(nickname).some(character => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint < 32 || codePoint === 127;
  });
  if (!nickname || nickname.length > 64 || containsControlCharacter) {
    throw createError({ statusCode: 400, statusMessage: 'nickname must be 1 to 64 safe characters.' });
  }
  return nickname;
}

export default defineEventHandler(async event => {
  // 换昵称同样必须先从 HttpOnly Cookie 恢复当前访客，不能相信客户端传来的 ID。
  const token = getSessionToken(event);
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Visitor session is required.' });
  }

  const session = await findValidVisitorSession(hashSessionToken(token));
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Visitor session is invalid or expired.' });
  }

  let body: NicknameBody;
  try {
    // readBody 会解析 JSON 请求体；格式错误时转成明确的 400 响应。
    body = (await readBody<NicknameBody>(event)) ?? {};
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body.' });
  }

  let nickname = validateNickname(body.nickname);
  if (nickname === session.visitor.nickname && body.nickname === undefined) {
    // 极小概率下随机昵称可能与旧昵称相同，重试直到真正发生变化。
    do {
      nickname = createNickname();
    } while (nickname === session.visitor.nickname);
  }

  const visitor = await updateVisitorNickname(session.visitor.id, nickname);
  // 已发布帖子的作者快照不在这里修改；这里只更新访客当前昵称。
  return { visitor: toPublicVisitor(visitor) };
});
