/**
 * 服务端认证工具。
 *
 * 负责从匿名会话 Cookie 恢复当前身份，并提供后续用户系统可复用的
 * Bearer Token 提取入口；权限判断不放在本文件中。
 */
import { getHeader, type H3Event } from 'h3';
import type { VisitorWithSession } from '../repositories/visitorRepository';
import { findValidVisitorSession } from '../repositories/visitorRepository';
import { apiError } from './apiResponse';
import { getSessionToken, hashSessionToken } from './visitorSession';

/** 验证匿名会话并缓存到请求上下文，供认证中间件调用。 */
export async function requireVisitorSession(event: H3Event): Promise<VisitorWithSession> {
  const cachedSession = event.context.visitorSession as VisitorWithSession | undefined;
  if (cachedSession) return cachedSession;

  const token = getSessionToken(event);
  if (!token) apiError(401, 'VISITOR_SESSION_REQUIRED', 'Visitor session is required.');

  const session = await findValidVisitorSession(hashSessionToken(token));
  if (!session) apiError(401, 'VISITOR_SESSION_INVALID', 'Visitor session is invalid or expired.');

  event.context.visitorSession = session;
  return session;
}

/** 读取认证中间件写入的匿名会话，不重复验证 token。 */
export function getVisitorSession(event: H3Event): VisitorWithSession {
  const session = event.context.visitorSession as VisitorWithSession | undefined;
  if (!session) {
    apiError(500, 'AUTH_CONTEXT_MISSING', 'Authentication middleware did not provide a visitor session.');
  }
  return session;
}

/** 从 Authorization 请求头提取 Bearer token，供未来用户认证使用。 */
export function getBearerToken(event: H3Event) {
  const authorization = getHeader(event, 'authorization');
  const [scheme, token] = authorization?.trim().split(/\s+/, 2) ?? [];
  return scheme?.toLowerCase() === 'bearer' && token && token.length <= 4096 ? token : undefined;
}
