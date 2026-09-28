import { apiError, apiSuccess, defineApiHandler } from '../../utils/apiResponse';
import { readJsonBody } from '../../utils/requestValidation';
import { AiServiceUnavailableError, requestAiReply, type AiChatMessage } from '../../services/aiClient';

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

function validateMessages(input: unknown): AiChatMessage[] {
  if (typeof input !== 'object' || input === null || !Array.isArray((input as { messages?: unknown }).messages)) {
    apiError(400, 'INVALID_AI_CHAT_INPUT', 'Messages must be provided as an array.');
  }

  const messages = (input as { messages: unknown[] }).messages;
  if (!messages.length || messages.length > MAX_MESSAGES) {
    apiError(400, 'INVALID_AI_CHAT_INPUT', `Messages must contain between 1 and ${MAX_MESSAGES} items.`);
  }

  const validated = messages.map(message => {
    if (typeof message !== 'object' || message === null) {
      apiError(400, 'INVALID_AI_CHAT_INPUT', 'Each message must include a role and content.');
    }

    const { role, content } = message as { role?: unknown; content?: unknown };
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
      apiError(400, 'INVALID_AI_CHAT_INPUT', 'Each message must include a valid role and content.');
    }

    const normalizedContent = content.trim();
    if (!normalizedContent || normalizedContent.length > MAX_MESSAGE_LENGTH) {
      apiError(400, 'INVALID_AI_CHAT_INPUT', `Each message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`);
    }

    return { role, content: normalizedContent };
  });

  if (validated.at(-1)?.role !== 'user') {
    apiError(400, 'INVALID_AI_CHAT_INPUT', 'The last message must be sent by the user.');
  }
  return validated;
}

export default defineApiHandler(async event => {
  const { messages } = await readJsonBody<{ messages?: unknown }>(event);
  const validatedMessages = validateMessages({ messages });

  try {
    return apiSuccess(await requestAiReply(validatedMessages));
  } catch (error) {
    if (error instanceof AiServiceUnavailableError) {
      apiError(503, 'AI_SERVICE_NOT_CONFIGURED', 'AI service has not been configured yet.');
    }
    throw error;
  }
});
