import { apiSuccess, defineApiHandler } from '../../../utils/apiResponse';
import { getVisitorSession } from '../../../utils/auth';
import { createAiConversation } from '../../../repositories/ai-chat-repository';

export default defineApiHandler(async event => {
  const session = getVisitorSession(event);
  return apiSuccess(await createAiConversation(session.visitor.id));
});
