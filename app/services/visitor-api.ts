import type { ApiSuccess } from '~/types/api';
import type { VisitorIdentity } from '~/types/visitor';

// 访客 service 只负责调用匿名身份接口，不持有 useState 或页面 loading 状态。
type VisitorResponse = ApiSuccess<VisitorIdentity>;

/** 初始化当前浏览器对应的匿名访客身份。 */
export async function bootstrapVisitor() {
  const response = await $fetch<VisitorResponse>('/api/visitors/bootstrap', { method: 'POST' });
  return response.data;
}

/** 修改匿名访客昵称；不传昵称时由服务端生成新的随机昵称。 */
export async function updateVisitorNickname(nickname?: string) {
  const response = await $fetch<VisitorResponse>('/api/visitors/nickname', {
    method: 'PATCH',
    body: nickname === undefined ? {} : { nickname }
  });
  return response.data;
}
