import type { ApiSuccess } from '~/types/api';
import type { PublicTopic } from '~/types/post';

// 主题目前只有公开读取接口，统一封装后页面不需要关心响应包装格式。
/** 读取可用的公开主题列表。 */
export async function listTopics() {
  const response = await $fetch<ApiSuccess<PublicTopic[]>>('/api/topics');
  return response.data;
}
