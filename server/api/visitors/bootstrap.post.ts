import {
  createVisitorSession,
  findValidVisitorSession,
  toPublicVisitor,
  touchVisitorSession
} from '../../repositories/visitorRepository';
import {
  createNickname,
  createSessionToken,
  getSessionToken,
  hashSessionToken,
  setSessionTokenToCookie,
  VISITOR_SESSION_RENEWAL_THRESHOLD_SECONDS,
  VISITOR_SESSION_TTL_SECONDS
} from '../../utils/visitorSession';
import { apiError, apiSuccess, defineApiHandler } from '../../utils/apiResponse';

export default defineApiHandler(async event => {
  // bootstrap 是前端进入站点时调用的入口：有有效 Cookie 就恢复，没有就创建。
  const currentToken = getSessionToken(event);
  const now = new Date();

  if (currentToken) {
    // Cookie 原文只在内存中短暂存在，查库时立即转换为哈希。
    const session = await findValidVisitorSession(hashSessionToken(currentToken), now);

    if (session) {
      const shouldRenew =
        session.expiresAt.getTime() - now.getTime() <= VISITOR_SESSION_RENEWAL_THRESHOLD_SECONDS * 1000;
      const renewedExpiresAt = shouldRenew ? new Date(now.getTime() + VISITOR_SESSION_TTL_SECONDS * 1000) : undefined;

      // 每次恢复会话都会记录活跃时间；只有接近过期时才同步续期数据库会话和浏览器 Cookie。
      await touchVisitorSession(session.id, session.visitor.id, now, renewedExpiresAt);
      if (shouldRenew) setSessionTokenToCookie(event, currentToken);
      return apiSuccess(toPublicVisitor(session.visitor));
    }
  }

  const token = createSessionToken();
  // 只把哈希写入数据库；原始 token 仅用于下面的 HttpOnly Cookie。
  const visitor = await createVisitorSession(
    createNickname(),
    hashSessionToken(token),
    new Date(now.getTime() + VISITOR_SESSION_TTL_SECONDS * 1000)
  );

  if (!visitor.visitor || !visitor.session) {
    // 这是防御性检查，正常情况下事务返回的两个对象一定存在。
    apiError(500, 'VISITOR_SESSION_CREATION_FAILED', 'Unable to create visitor session.');
  }

  setSessionTokenToCookie(event, token);
  // 响应只返回公开身份信息，不返回 token 或数据库 session id。
  return apiSuccess(toPublicVisitor(visitor.visitor));
});
