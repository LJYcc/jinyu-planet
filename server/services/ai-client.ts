/**
 * 千问服务端流式适配器。
 *
 * 这个文件只负责供应商通信：读取服务端环境变量、发起请求并解析上游流。
 * 会话归属、数据库保存和前端响应格式由外层 API 负责，便于后续替换模型供应商。
 */

export type AiModelMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AiStreamDelta = {
  content?: string;
  reasoningContent?: string;
};

export class AiServiceUnavailableError extends Error {
  constructor() {
    super('AI service has not been configured.');
    this.name = 'AiServiceUnavailableError';
  }
}

export class AiUpstreamError extends Error {
  constructor(
    public readonly reason: 'timeout' | 'http' | 'invalid_response',
    public readonly statusCode?: number
  ) {
    super('The AI provider request failed.');
    this.name = 'AiUpstreamError';
  }
}

const DEFAULT_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const DEFAULT_MODEL = 'qwen-plus';
const DEFAULT_IDLE_TIMEOUT = 30_000;

/** 深度思考由服务端配置控制；默认开启是因为当前部署模型已确认支持该能力。 */
export function isDeepThinkingAvailable() {
  return Boolean(process.env.QWEN_API_KEY?.trim()) && process.env.QWEN_DEEP_THINKING_ENABLED !== 'false';
}

/** 读取并规范化千问服务配置，集中处理默认地址、模型和超时。 */
function getConfig() {
  const apiKey = process.env.QWEN_API_KEY?.trim();
  if (!apiKey) throw new AiServiceUnavailableError();

  const configuredUrl = process.env.QWEN_BASE_URL?.trim() || DEFAULT_URL;
  // 兼容两种环境变量写法：基础地址以 /v1 结尾，或直接填写完整 chat/completions 地址。
  const url = /\/v1\/?$/i.test(configuredUrl) ? `${configuredUrl.replace(/\/$/, '')}/chat/completions` : configuredUrl;
  const idleTimeout = Number(process.env.QWEN_TIMEOUT_MS);

  return {
    apiKey,
    url,
    model: process.env.QWEN_MODEL?.trim() || DEFAULT_MODEL,
    idleTimeoutMs: Number.isInteger(idleTimeout) && idleTimeout > 0 ? idleTimeout : DEFAULT_IDLE_TIMEOUT
  };
}

/** 从上游响应中提取可用于错误映射的 HTTP 状态码。 */
function readErrorStatus(response: Response) {
  return response.status >= 400 ? response.status : undefined;
}

/** 从一条 OpenAI-compatible 响应中提取增量文本。 */
function getDelta(payload: unknown): AiStreamDelta | undefined {
  // 供应商响应来自网络，先逐层确认数据结构，再读取 content。
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return undefined;
  }

  const firstChoice = choices[0];
  if (typeof firstChoice !== 'object' || firstChoice === null) {
    return undefined;
  }

  const delta = (firstChoice as { delta?: unknown }).delta;
  if (typeof delta !== 'object' || delta === null) {
    return undefined;
  }

  const value = delta as { content?: unknown; reasoning_content?: unknown; reasoningContent?: unknown };
  const content = typeof value.content === 'string' ? value.content : undefined;
  const reasoningContent =
    typeof value.reasoning_content === 'string'
      ? value.reasoning_content
      : typeof value.reasoningContent === 'string'
        ? value.reasoningContent
        : undefined;

  if (content === undefined && reasoningContent === undefined) {
    return undefined;
  }

  return { content, reasoningContent };
}

/** 将 OpenAI-compatible SSE 中的 data 行转换为文本片段。 */
async function* readSseDeltas(
  body: ReadableStream<Uint8Array>,
  options: { controller: AbortController; idleTimeoutMs: number }
): AsyncGenerator<AiStreamDelta> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      let idleTimeoutTriggered = false;
      const idleTimer = setTimeout(() => {
        idleTimeoutTriggered = true;
        options.controller.abort();
      }, options.idleTimeoutMs);

      let readResult: ReadableStreamReadResult<Uint8Array>;
      try {
        readResult = await reader.read();
      } catch (error) {
        if (idleTimeoutTriggered) {
          throw new AiUpstreamError('timeout');
        }
        throw error;
      } finally {
        clearTimeout(idleTimer);
      }

      if (idleTimeoutTriggered) {
        throw new AiUpstreamError('timeout');
      }

      const { done, value } = readResult;
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      // 网络分块不保证正好对应一行 SSE 数据，最后一段残缺文本必须留到下一次读取再解析。
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data:')) {
          continue;
        }

        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') {
          continue;
        }

        let payload: unknown;

        try {
          payload = JSON.parse(data);
        } catch {
          throw new AiUpstreamError('invalid_response');
        }

        const delta = getDelta(payload);
        if (delta) {
          yield delta;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** 打开千问流；真正的文本片段由返回的 async generator 逐段产生。 */
export async function openAiStream(messages: AiModelMessage[], options: { enableThinking?: boolean } = {}) {
  const config = getConfig();
  const controller = new AbortController();
  const connectionTimer = setTimeout(() => {
    controller.abort();
  }, config.idleTimeoutMs);

  try {
    // 请求体明确开启 stream，让供应商返回可以逐段读取的响应流。
    const requestBody = JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      // Python SDK 的 extra_body 会把该字段合并到 HTTP JSON；原生 fetch 直接发送顶层参数。
      ...(options.enableThinking ? { enable_thinking: true } : {})
    });
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        'content-type': 'application/json'
      },
      body: requestBody,
      signal: controller.signal
    });
    clearTimeout(connectionTimer);

    if (!response.ok) {
      throw new AiUpstreamError('http', readErrorStatus(response));
    }

    if (!response.body) {
      throw new AiUpstreamError('invalid_response');
    }

    const source = readSseDeltas(response.body, { controller, idleTimeoutMs: config.idleTimeoutMs });
    /** 转发上游文本片段；流式阶段采用每次读取的空闲超时。 */
    async function* deltas() {
      for await (const delta of source) {
        yield delta;
      }
    }

    const cancel = () => {
      controller.abort();
    };

    return {
      deltas: deltas(),
      cancel
    };
  } catch (error) {
    clearTimeout(connectionTimer);

    if (error instanceof AiUpstreamError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new AiUpstreamError('timeout');
    }
    throw new AiUpstreamError('http');
  }
}
