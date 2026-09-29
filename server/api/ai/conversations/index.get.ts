import { apiSuccess, defineApiHandler } from '../../../utils/apiResponse';
import { getVisitorSession } from '../../../utils/auth';
import { listAiConversations } from '../../../repositories/ai-chat-repository';

export default defineApiHandler(async event => {
  const session = getVisitorSession(event);
  return apiSuccess(await listAiConversations(session.visitor.id));
});
