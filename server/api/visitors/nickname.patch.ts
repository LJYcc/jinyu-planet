import { toPublicVisitor, updateVisitorNickname } from '../../repositories/visitorRepository';
import { apiError, apiSuccess, defineApiHandler } from '../../utils/apiResponse';
import { getVisitorSession } from '../../utils/auth';
import { readJsonBody } from '../../utils/requestValidation';
import { createNickname } from '../../utils/visitorSession';

type NicknameBody = { nickname?: unknown };

function validateNickname(value: unknown) {
  // 不传 nickname 时代表“换一个系统生成的昵称”。
  if (value === undefined) return createNickname();
  if (typeof value !== 'string') {
    apiError(400, 'INVALID_NICKNAME', 'nickname must be a string.');
  }

  const nickname = value.trim();
  // 控制字符可能破坏日志、页面显示或下游文本处理，因此拒绝保存。
  const containsControlCharacter = Array.from(nickname).some(character => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint < 32 || codePoint === 127;
  });
  if (!nickname || nickname.length > 64 || containsControlCharacter) {
    apiError(400, 'INVALID_NICKNAME', 'nickname must be 1 to 64 safe characters.');
  }
  return nickname;
}

export default defineApiHandler(async event => {
  // 换昵称同样必须先从 HttpOnly Cookie 恢复当前访客，不能相信客户端传来的 ID。
  const session = getVisitorSession(event);
  const body = await readJsonBody<NicknameBody>(event);

  let nickname = validateNickname(body.nickname);
  if (nickname === session.visitor.nickname && body.nickname === undefined) {
    // 极小概率下随机昵称可能与旧昵称相同，重试直到真正发生变化。
    do {
      nickname = createNickname();
    } while (nickname === session.visitor.nickname);
  }

  const visitor = await updateVisitorNickname(session.visitor.id, nickname);
  // 帖子通过 visitorId 关联当前访客，因此历史和后续帖子都会展示这个新昵称。
  return apiSuccess(toPublicVisitor(visitor));
});
