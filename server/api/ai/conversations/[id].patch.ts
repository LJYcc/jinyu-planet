/**
 * AI 会话编辑接口。
 *
 * 只允许当前匿名访客修改自己会话的标题和置顶状态；消息内容仍由消息接口负责。
 */
import { getRouterParam } from 'h3';
import { apiError, apiSuccess, defineApiHandler } from '../../../utils/apiResponse';
import { getVisitorSession } from '../../../utils/auth';
import { updateOwnedAiConversation } from '../../../repositories/ai-chat-repository';
import { validateConversationId, validateConversationUpdate } from '../../../utils/ai-chat-validation';
import { readJsonBody } from '../../../utils/requestValidation';

export default defineApiHandler(async event => {
  const session = getVisitorSession(event);
  const conversationId = validateConversationId(getRouterParam(event, 'id'));
  const body = await readJsonBody<{ title?: unknown; isPinned?: unknown }>(event);
  const update = validateConversationUpdate(body ?? {});
  const conversation = await updateOwnedAiConversation(session.visitor.id, conversationId, update);

  if (!conversation) {
    apiError(404, 'AI_CONVERSATION_NOT_FOUND', 'Conversation was not found.');
  }

  return apiSuccess(conversation);
});
