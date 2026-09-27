/**
 * 服务端授权工具。
 *
 * 负责判断当前已认证主体是否拥有某项操作权限；认证身份由 auth.ts
 * 提供，本文件只处理“能不能做”的规则。
 */
import { apiError } from './apiResponse';

/** 权限不足时抛出统一的 HTTP 403 错误。 */
export function requirePermission(
  allowed: boolean,
  code = 'FORBIDDEN',
  message = 'You do not have permission to perform this action.'
): asserts allowed {
  if (!allowed) apiError(403, code, message);
}

/** 校验资源归属，防止主体访问或修改其他主体的资源。 */
export function requireResourceOwner(ownerId: string, principalId: string) {
  requirePermission(
    ownerId === principalId,
    'RESOURCE_FORBIDDEN',
    'You do not have permission to access this resource.'
  );
}
