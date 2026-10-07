/**
 * AI 会话消息发送接口。
 *
 * 这个接口接收当前用户的一条消息，服务端从数据库读取最近上下文后请求千问，
 * 再通过 SSE 将回答片段实时转发给前端。用户消息会先保存，完整 assistant 回答
 * 只在上游流正常结束后保存，从而同时支持重试幂等、流式输出和历史记录持久化。
 */
import { getRouterParam, setHeader } from 'h3';
import { apiError, defineApiHandler } from '../../../../utils/apiResponse';
import { getVisitorSession } from '../../../../utils/auth';
import { readJsonBody } from '../../../../utils/requestValidation';
import {
  createAssistantMessage,
  createOrReuseUserMessage,
  findAssistantAfterUser,
  findOwnedAiConversation,
  listRecentAiMessagesForModel
} from '../../../../repositories/ai-chat-repository';
import {
  MAX_AI_CONTEXT_MESSAGES,
  validateConversationId,
  validateCurrentMessage
} from '../../../../utils/ai-chat-validation';
import { getPublicAiError, throwAiApiError } from '../../../../utils/ai-chat-errors';
import {
  isDeepThinkingAvailable,
  isWebSearchAvailable,
  openAiStream,
  type AiModelMessage,
  type AiSearchSource
} from '../../../../services/ai-client';

const MAX_AI_REPLY_LENGTH = 1_000_000;
const AI_SYSTEM_PROMPT = '你是金鱼星球的 AI 助理。请用清晰、诚实、易读的方式回答用户，不要编造无法确认的事实。';
const encoder = new TextEncoder();

/** 将一个业务事件编码成浏览器可识别的 SSE data 消息。 */
function encodeEvent(payload: Record<string, unknown>) {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

/** 将内部异常转换为可以通过 SSE 发送给前端的公开错误事件。 */
function getStreamError(error: unknown) {
  const publicError = getPublicAiError(error);
  return encodeEvent({ type: 'error', ...publicError });
}

/** 仅在流仍处于打开状态时写入数据，避免客户端取消后重复 enqueue。 */
function enqueueIfOpen(controller: ReadableStreamDefaultController<Uint8Array>, payload: Uint8Array) {
  // 浏览器停止读取后，desiredSize 会变成 null；此时不能再写入控制器。
  if (controller.desiredSize !== null) controller.enqueue(payload);
}

/** 执行一次完整的 AI 消息请求，并返回 SSE 流。 */
export default defineApiHandler(async event => {
  // 第一阶段：从中间件写入的上下文中取得访客身份，并确认会话归属。
  const session = getVisitorSession(event);
  const conversationId = validateConversationId(getRouterParam(event, 'id'));
  const conversation = await findOwnedAiConversation(session.visitor.id, conversationId);
  if (!conversation) {
    apiError(404, 'AI_CONVERSATION_NOT_FOUND', 'Conversation was not found.');
  }

  const body = await readJsonBody<{
    content?: unknown;
    clientNonce?: unknown;
    deepThinking?: unknown;
    webSearch?: unknown;
  }>(event);
  const { content, clientNonce, deepThinking, webSearch } = validateCurrentMessage(body ?? {});
  if (deepThinking && !isDeepThinkingAvailable()) {
    apiError(503, 'AI_THINKING_UNAVAILABLE', 'Deep thinking is not available for the current AI service.');
  }
  if (webSearch && !isWebSearchAvailable()) {
    apiError(503, 'AI_SEARCH_UNAVAILABLE', 'Web search is not configured.');
  }
  // 用户消息先落库。即使模型随后失败，用户仍能通过同一 nonce 重试，而不会产生重复消息。
  const userMessage = await createOrReuseUserMessage(session.visitor.id, conversationId, content, clientNonce);
  if (!userMessage) apiError(404, 'AI_CONVERSATION_NOT_FOUND', 'Conversation was not found.');

  const existingAssistant = await findAssistantAfterUser(conversationId, userMessage.createdAt);
  if (existingAssistant) {
    // 重试已完成请求时直接回放已保存回答，不再消耗一次模型调用额度。
    const replay = new ReadableStream<Uint8Array>({
      /** 将已保存的完整回答伪装成一次正常的 SSE 流返回。 */
      start(controller) {
        if (existingAssistant.searchSources) {
          controller.enqueue(
            encodeEvent({ type: 'search_results', sources: JSON.parse(existingAssistant.searchSources) })
          );
        }
        if (existingAssistant.reasoningContent) {
          controller.enqueue(
            encodeEvent({ type: 'reasoning_delta', reasoningContent: existingAssistant.reasoningContent })
          );
          if (existingAssistant.reasoningDurationMs !== null) {
            controller.enqueue(
              encodeEvent({ type: 'reasoning_done', reasoningDurationMs: existingAssistant.reasoningDurationMs })
            );
          }
        }
        controller.enqueue(encodeEvent({ type: 'answer_delta', content: existingAssistant.content }));
        controller.enqueue(encodeEvent({ type: 'done' }));
        controller.close();
      }
    });
    setHeader(event, 'content-type', 'text/event-stream; charset=utf-8');
    setHeader(event, 'cache-control', 'no-cache, no-transform');
    setHeader(event, 'connection', 'keep-alive');
    return replay;
  }

  let upstream: Awaited<ReturnType<typeof openAiStream>> | undefined;

  // 将搜索、模型流和持久化串在同一条 SSE 生命周期中，搜索来源不会被模型文本伪造。
  const stream = new ReadableStream<Uint8Array>({
    /** 消费上游增量、转发给浏览器，并在成功结束后持久化完整回答。 */
    async start(controller) {
      let fullContent = '';
      let fullReasoningContent = '';
      let reasoningStartedAt: number | undefined;
      let reasoningDurationMs: number | null = null;
      let searchSources: AiSearchSource[] = [];
      let lastSearchSourcesFingerprint: string | undefined;

      try {
        if (webSearch) enqueueIfOpen(controller, encodeEvent({ type: 'search_started' }));

        const history = await listRecentAiMessagesForModel(conversationId, MAX_AI_CONTEXT_MESSAGES);
        const modelMessages: AiModelMessage[] = [{ role: 'system', content: AI_SYSTEM_PROMPT }, ...history];
        try {
          upstream = await openAiStream(modelMessages, { enableThinking: deepThinking, enableSearch: webSearch });
        } catch (error) {
          throwAiApiError(error);
        }

        for await (const delta of upstream.deltas) {
          if (delta.searchSources?.length) {
            searchSources = delta.searchSources;
            // DashScope 会在后续答案片段中重复携带同一份 search_results。
            // 只在来源首次出现或实际变更时转发，避免浏览器收到大量相同 SSE 事件。
            const fingerprint = JSON.stringify(searchSources);
            if (fingerprint !== lastSearchSourcesFingerprint) {
              lastSearchSourcesFingerprint = fingerprint;
              enqueueIfOpen(controller, encodeEvent({ type: 'search_results', sources: searchSources }));
            }
          }
          if (delta.reasoningContent) {
            reasoningStartedAt ??= Date.now();
            fullReasoningContent += delta.reasoningContent;
            enqueueIfOpen(
              controller,
              encodeEvent({ type: 'reasoning_delta', reasoningContent: delta.reasoningContent })
            );
          }
          if (delta.content) {
            if (reasoningStartedAt !== undefined && reasoningDurationMs === null) {
              reasoningDurationMs = Math.max(0, Date.now() - reasoningStartedAt);
              enqueueIfOpen(controller, encodeEvent({ type: 'reasoning_done', reasoningDurationMs }));
            }
            fullContent += delta.content;
            enqueueIfOpen(controller, encodeEvent({ type: 'answer_delta', content: delta.content }));
          }
          if (fullContent.length + fullReasoningContent.length > MAX_AI_REPLY_LENGTH) {
            throw new Error('AI response exceeded the maximum length.');
          }
        }

        if (!fullContent.trim()) throw new Error('AI response was empty.');
        if (webSearch && !searchSources.length) {
          enqueueIfOpen(controller, encodeEvent({ type: 'search_results', sources: [] }));
        }
        if (reasoningStartedAt !== undefined && reasoningDurationMs === null) {
          reasoningDurationMs = Math.max(0, Date.now() - reasoningStartedAt);
          enqueueIfOpen(controller, encodeEvent({ type: 'reasoning_done', reasoningDurationMs }));
        }
        // 前端只收到片段，数据库只保存完整回答；两者的职责分开才能正确处理流中断。
        await createAssistantMessage(
          conversationId,
          fullContent,
          fullReasoningContent,
          reasoningDurationMs,
          searchSources
        );
        enqueueIfOpen(controller, encodeEvent({ type: 'done' }));
        if (controller.desiredSize !== null) controller.close();
      } catch (error) {
        enqueueIfOpen(controller, getStreamError(error));
        if (controller.desiredSize !== null) controller.close();
      }
    },
    /** 浏览器停止读取时，主动取消上游请求，避免继续消耗模型资源。 */
    cancel() {
      upstream?.cancel();
    }
  });

  setHeader(event, 'content-type', 'text/event-stream; charset=utf-8');
  setHeader(event, 'cache-control', 'no-cache, no-transform');
  setHeader(event, 'connection', 'keep-alive');
  setHeader(event, 'x-accel-buffering', 'no');
  return stream;
});
