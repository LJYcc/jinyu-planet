/**
 * API 认证中间件。
 *
 * 只对需要匿名会话的写接口执行认证，并将验证后的会话放入 event.context。
 * 公开读取接口和访客 bootstrap 接口不会被本中间件拦截。
 */
import { defineApiHandler } from '../utils/apiResponse';
import { requireVisitorSession } from '../utils/auth';

type ProtectedRoute = {
  method: string;
  path: string;
};

// 只有明确需要身份的写接口进入认证中间件，公开读取接口和 bootstrap 保持匿名可访问。
const protectedRoutes: ProtectedRoute[] = [
  { method: 'POST', path: '/api/posts' },
  { method: 'PATCH', path: '/api/visitors/nickname' },
  { method: 'POST', path: '/api/uploads' }
];

/** 判断当前请求是否属于需要匿名会话的受保护路由。 */
function isProtectedRoute(method: string, path: string) {
  if (path === '/api/uploads' || path.startsWith('/api/uploads/')) {
    return true;
  }

  if (path === '/api/ai/conversations' || path.startsWith('/api/ai/conversations/')) {
    return true;
  }

  return protectedRoutes.some(route => route.method === method && route.path === path);
}

/** 在请求进入具体 API handler 前完成受保护路由的会话认证。 */
export default defineApiHandler(async event => {
  const method = event.method.toUpperCase();
  const path = event.path;

  if (isProtectedRoute(method, path)) await requireVisitorSession(event);
});
