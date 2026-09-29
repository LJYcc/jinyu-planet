/**
 * AI 请求参数校验工具。
 *
 * 集中限制消息长度、幂等 nonce 和会话 ID 格式，确保 API 路由进入数据库
 * 或模型服务前已经完成基础输入校验。
 */
import { apiError } from './apiResponse';

export const MAX_AI_MESSAGE_LENGTH = 4000;
export const MAX_AI_CONTEXT_MESSAGES = 20;

type CurrentMessageInput = {
  content?: unknown;
  clientNonce?: unknown;
};

type ConversationUpdateInput = {
  title?: unknown;
  isPinned?: unknown;
};

/** 校验一次发送请求；role 和 visitorId 都由服务端决定，客户端不能提交。 */
export function validateCurrentMessage(input: CurrentMessageInput) {
  if (typeof input.content !== 'string') {
    apiError(400, 'INVALID_AI_MESSAGE', 'Message content must be a string.');
  }

  const content = input.content.trim();
  if (!content || content.length > MAX_AI_MESSAGE_LENGTH) {
    apiError(400, 'INVALID_AI_MESSAGE', `Message content must be between 1 and ${MAX_AI_MESSAGE_LENGTH} characters.`);
  }

  if (typeof input.clientNonce !== 'string' || input.clientNonce.length > 64) {
    apiError(400, 'INVALID_AI_MESSAGE_NONCE', 'A valid client nonce is required.');
  }

  return { content, clientNonce: input.clientNonce };
}

/** 只接受路由参数中的 UUID，避免把任意字符串带入数据库查询。 */
export function validateConversationId(id: string | undefined) {
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    apiError(400, 'INVALID_AI_CONVERSATION_ID', 'Conversation id is invalid.');
  }
  return id;
}

/** 校验会话编辑请求，只允许修改标题和置顶状态。 */
export function validateConversationUpdate(input: ConversationUpdateInput) {
  const update: { title?: string; isPinned?: boolean } = {};

  if (input.title !== undefined) {
    if (typeof input.title !== 'string') {
      apiError(400, 'INVALID_AI_CONVERSATION_TITLE', 'Conversation title must be a string.');
    }

    const title = input.title.trim();
    if (!title || title.length > 160) {
      apiError(400, 'INVALID_AI_CONVERSATION_TITLE', 'Conversation title must be between 1 and 160 characters.');
    }

    update.title = title;
  }

  if (input.isPinned !== undefined) {
    if (typeof input.isPinned !== 'boolean') {
      apiError(400, 'INVALID_AI_CONVERSATION_PIN', 'Conversation pin state must be a boolean.');
    }

    update.isPinned = input.isPinned;
  }

  if (!Object.keys(update).length) {
    apiError(400, 'INVALID_AI_CONVERSATION_UPDATE', 'At least one conversation field is required.');
  }

  return update;
}
