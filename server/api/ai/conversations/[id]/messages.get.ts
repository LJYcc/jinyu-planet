import { getRouterParam } from 'h3';
import { apiError, apiSuccess, defineApiHandler } from '../../../../utils/apiResponse';
import { getVisitorSession } from '../../../../utils/auth';
import { listAiMessages } from '../../../../repositories/ai-chat-repository';
import { validateConversationId } from '../../../../utils/ai-chat-validation';

export default defineApiHandler(async event => {
  const session = getVisitorSession(event);
  const conversationId = validateConversationId(getRouterParam(event, 'id'));
  const messages = await listAiMessages(session.visitor.id, conversationId);

  if (!messages) apiError(404, 'AI_CONVERSATION_NOT_FOUND', 'Conversation was not found.');
  return apiSuccess(messages);
});
