/** DashScope 原生多模态流式适配器。 */

export type AiModelMessage = {
  // 外层 API 只传递纯文本历史；这里再转换为 DashScope 要求的内容数组。
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AiSearchSource = {
  // 来源只接受上游返回的 http(s) 链接，禁止从模型正文中猜测或拼接。
  id: string;
  title: string;
  url: string;
  snippet?: string;
};

export type AiStreamDelta = {
  content?: string;
  reasoningContent?: string;
  searchSources?: AiSearchSource[];
};

export class AiServiceUnavailableError extends Error {
  // 缺少服务端密钥时使用独立错误，便于 API 层映射为“服务未配置”。
  constructor() {
    super('AI service has not been configured.');
    this.name = 'AiServiceUnavailableError';
  }
}

export class AiUpstreamError extends Error {
  // 将网络、HTTP 和响应格式错误统一为外层可识别的错误类型。
  constructor(
    public readonly reason: 'timeout' | 'http' | 'invalid_response',
    public readonly statusCode?: number
  ) {
    super('The AI provider request failed.');
    this.name = 'AiUpstreamError';
  }
}

const DEFAULT_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
const DEFAULT_MODEL = 'qwen3.8-max';
const DEFAULT_IDLE_TIMEOUT = 30_000;

export function isDeepThinkingAvailable() {
  // 能力开关由服务端环境变量控制，浏览器不能自行伪造开启状态。
  return Boolean(process.env.QWEN_API_KEY?.trim()) && process.env.QWEN_DEEP_THINKING_ENABLED !== 'false';
}

export function isWebSearchAvailable() {
  // 搜索开关同时受密钥和显式配置控制，关闭时 API 会拒绝请求。
  return Boolean(process.env.QWEN_API_KEY?.trim()) && process.env.QWEN_WEB_SEARCH_ENABLED !== 'false';
}

function getConfig() {
  const apiKey = process.env.QWEN_API_KEY?.trim();
  if (!apiKey) throw new AiServiceUnavailableError();

  // 允许配置完整端点，也兼容只填写 DashScope /v1 基础地址的旧写法。
  const configuredUrl = process.env.QWEN_BASE_URL?.trim() || DEFAULT_URL;
  const url = /\/v1\/?$/i.test(configuredUrl)
    ? `${configuredUrl.replace(/\/$/, '')}/services/aigc/multimodal-generation/generation`
    : configuredUrl;
  const idleTimeout = Number(process.env.QWEN_TIMEOUT_MS);

  return {
    apiKey,
    url,
    model: process.env.QWEN_MODEL?.trim() || DEFAULT_MODEL,
    idleTimeoutMs: Number.isInteger(idleTimeout) && idleTimeout > 0 ? idleTimeout : DEFAULT_IDLE_TIMEOUT
  };
}

function readErrorStatus(response: Response) {
  // 不把上游响应正文直接暴露给客户端，只保留状态码供错误映射使用。
  return response.status >= 400 ? response.status : undefined;
}

function readText(value: unknown): string | undefined {
  // 原生多模态接口的 message.content 是 [{ text }]；兼容字符串便于处理异常响应。
  if (typeof value === 'string') return value;
  if (!Array.isArray(value)) return undefined;
  const text = value
    .map(part => {
      if (typeof part !== 'object' || part === null) return '';
      const candidate = (part as { text?: unknown }).text;
      return typeof candidate === 'string' ? candidate : '';
    })
    .join('');
  return text || undefined;
}

function readSearchSources(value: unknown): AiSearchSource[] | undefined {
  // DashScope 来源位于 search_info.search_results；逐条校验并去重后再向前端传递。
  if (typeof value !== 'object' || value === null) return undefined;
  const searchResults = (value as { search_results?: unknown }).search_results;
  if (!Array.isArray(searchResults)) return undefined;

  const sources: AiSearchSource[] = [];
  const seen = new Set<string>();
  for (const result of searchResults) {
    if (typeof result !== 'object' || result === null) continue;
    const record = result as { title?: unknown; url?: unknown; snippet?: unknown; description?: unknown };
    if (
      typeof record.title !== 'string' ||
      typeof record.url !== 'string' ||
      !/^https?:\/\//i.test(record.url) ||
      seen.has(record.url)
    ) {
      continue;
    }
    seen.add(record.url);
    const snippet = typeof record.snippet === 'string' ? record.snippet : record.description;
    sources.push({
      id: `source-${sources.length + 1}`,
      title: record.title.slice(0, 240),
      url: record.url,
      ...(typeof snippet === 'string' && snippet ? { snippet: snippet.slice(0, 600) } : {})
    });
  }
  return sources.length ? sources : undefined;
}

/** 解析 DashScope 原生 SSE 的 output.choices 和 output.search_info。 */
function getDelta(payload: unknown): AiStreamDelta | undefined {
  // 搜索来源可能先于首个答案片段返回，因此没有文本时也要产出一个 delta。
  if (typeof payload !== 'object' || payload === null) return undefined;
  const output = (payload as { output?: unknown }).output;
  if (typeof output !== 'object' || output === null) return undefined;

  const outputRecord = output as { choices?: unknown; search_info?: unknown };
  const searchSources = readSearchSources(outputRecord.search_info);
  const firstChoice = Array.isArray(outputRecord.choices) ? outputRecord.choices[0] : undefined;
  const message =
    typeof firstChoice === 'object' && firstChoice !== null
      ? (firstChoice as { message?: unknown }).message
      : undefined;
  const messageRecord =
    typeof message === 'object' && message !== null ? (message as Record<string, unknown>) : undefined;
  const content = messageRecord ? readText(messageRecord.content) : undefined;
  const reasoningContent = messageRecord
    ? (readText(messageRecord.reasoning_content) ?? readText(messageRecord.reasoningContent))
    : undefined;

  if (content === undefined && reasoningContent === undefined && !searchSources?.length) return undefined;
  return { content, reasoningContent, ...(searchSources?.length ? { searchSources } : {}) };
}

async function* readSseDeltas(
  body: ReadableStream<Uint8Array>,
  options: { controller: AbortController; idleTimeoutMs: number }
): AsyncGenerator<AiStreamDelta> {
  // 使用 reader 逐块读取，避免等待完整响应；每个 read 都重新计算空闲超时。
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      let timedOut = false;
      const idleTimer = setTimeout(() => {
        timedOut = true;
        options.controller.abort();
      }, options.idleTimeoutMs);
      let result: ReadableStreamReadResult<Uint8Array>;
      try {
        result = await reader.read();
      } catch (error) {
        if (timedOut) throw new AiUpstreamError('timeout');
        throw error;
      } finally {
        clearTimeout(idleTimer);
      }
      if (timedOut) throw new AiUpstreamError('timeout');
      if (result.done) break;

      // 网络分块可能截断 SSE 行，保留最后一行到下一块再解析。
      buffer += decoder.decode(result.value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        let payload: unknown;
        try {
          payload = JSON.parse(data);
        } catch {
          throw new AiUpstreamError('invalid_response');
        }
        const delta = getDelta(payload);
        if (delta) yield delta;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function toDashScopeMessages(messages: AiModelMessage[]) {
  // multimodal-generation 即使只发送文字，也要求 content 使用图文内容数组。
  return messages.map(message => ({ role: message.role, content: [{ text: message.content }] }));
}

/** 打开原生多模态 SSE；联网时显式请求真实搜索来源。 */
export async function openAiStream(
  messages: AiModelMessage[],
  options: { enableThinking?: boolean; enableSearch?: boolean } = {}
) {
  // 上游请求只负责供应商通信；SSE 事件编排、数据库持久化和页面状态由 API 层处理。
  const config = getConfig();
  const controller = new AbortController();
  const connectionTimer = setTimeout(() => controller.abort(), config.idleTimeoutMs);

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        'content-type': 'application/json',
        // DashScope 原生流式协议通过请求头启用 SSE，而不是 OpenAI 的 stream 字段。
        'x-dashscope-sse': 'enable'
      },
      body: JSON.stringify({
        model: config.model,
        input: { messages: toDashScopeMessages(messages) },
        parameters: {
          enable_thinking: options.enableThinking === true,
          enable_search: options.enableSearch === true,
          // 显式传递 false，避免供应商按模型默认值返回思考内容。
          incremental_output: true,
          // enable_source 仅在搜索开启时传递，来源将从 search_info.search_results 返回。
          ...(options.enableSearch === true ? { search_options: { enable_source: true } } : {})
        }
      }),
      signal: controller.signal
    });
    clearTimeout(connectionTimer);
    if (!response.ok) throw new AiUpstreamError('http', readErrorStatus(response));
    if (!response.body) throw new AiUpstreamError('invalid_response');

    return {
      deltas: readSseDeltas(response.body, { controller, idleTimeoutMs: config.idleTimeoutMs }),
      cancel: () => controller.abort()
    };
  } catch (error) {
    clearTimeout(connectionTimer);
    // 配置错误不应伪装成上游网络异常；调用方会据此提示管理员补充服务端密钥。
    if (error instanceof AiServiceUnavailableError) throw error;
    if (error instanceof AiUpstreamError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new AiUpstreamError('timeout');
    throw new AiUpstreamError('http');
  }
}
