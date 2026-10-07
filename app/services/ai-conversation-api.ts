import type { AiCapabilities, ChatMessage, Conversation } from '~/types/ai-chat';
import type { ApiSuccess } from '~/types/api';

// 这个模块只封装 AI 会话相关的 HTTP 请求，不修改页面状态。
// 这样侧边栏和聊天面板都可以复用同一套接口调用方式。
export type UpdateAiConversationInput = {
  title?: string;
  isPinned?: boolean;
};

/** 读取服务端确认可用的 AI 能力；页面据此决定是否显示高级开关。 */
export async function getAiCapabilities() {
  const response = await $fetch<ApiSuccess<AiCapabilities>>('/api/ai/capabilities');
  return response.data;
}

/** 读取当前匿名访客的全部会话。 */
export async function listAiConversations() {
  const response = await $fetch<ApiSuccess<Conversation[]>>('/api/ai/conversations');
  return response.data;
}

/** 读取指定会话的历史消息。 */
export async function listAiConversationMessages(conversationId: string) {
  const response = await $fetch<ApiSuccess<ChatMessage[]>>(`/api/ai/conversations/${conversationId}/messages`);
  return response.data;
}

/** 创建一个空会话，实际发送消息时由父组件按需调用。 */
export async function createAiConversation() {
  const response = await $fetch<ApiSuccess<Conversation>>('/api/ai/conversations', { method: 'POST' });
  return response.data;
}

/** 更新会话标题或置顶状态，并返回服务端保存后的完整会话。 */
export async function updateAiConversation(conversationId: string, data: UpdateAiConversationInput) {
  const response = await $fetch<ApiSuccess<Conversation>>(`/api/ai/conversations/${conversationId}`, {
    method: 'PATCH',
    body: data
  });
  return response.data;
}

/** 删除指定会话，并返回服务端确认结果。 */
export async function deleteAiConversation(conversationId: string) {
  const response = await $fetch<ApiSuccess<{ deleted: boolean }>>(`/api/ai/conversations/${conversationId}`, {
    method: 'DELETE'
  });
  return response.data.deleted;
}

/**
 * 发起 AI 流式消息请求并保留原始 Response。
 * 浏览器端需要读取 Response.body，所以这里不能像普通接口一样直接解包 JSON。
 */
export function streamAiConversationMessage(
  conversationId: string,
  content: string,
  clientNonce: string,
  signal: AbortSignal,
  deepThinking = false,
  webSearch = false
) {
  return fetch(`/api/ai/conversations/${conversationId}/messages`, {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content, clientNonce, deepThinking, webSearch })
  });
}
