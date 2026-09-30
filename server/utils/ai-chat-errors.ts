/**
 * AI 错误转换工具。
 *
 * 将配置错误、供应商 HTTP 错误和流解析错误统一转换为本站稳定的错误码，
 * 供普通 JSON 响应和 SSE 错误事件复用，同时避免暴露上游原始异常。
 */
import { apiError } from './apiResponse';
import { AiServiceUnavailableError, AiUpstreamError } from '../services/ai-client';

export type PublicAiError = {
  code: string;
  message: string;
};

/** 将异常映射为流式响应也能使用的公开错误对象。 */
export function getPublicAiError(error: unknown): PublicAiError {
  if (error instanceof AiServiceUnavailableError) {
    return { code: 'AI_SERVICE_NOT_CONFIGURED', message: 'AI service has not been configured yet.' };
  }

  if (error instanceof AiUpstreamError) {
    if (error.statusCode === 402) {
      return { code: 'AI_PROVIDER_CREDITS_REQUIRED', message: 'The AI provider account has no available credits.' };
    }
    if (error.statusCode === 401 || error.statusCode === 403) {
      return { code: 'AI_PROVIDER_AUTH_FAILED', message: 'The AI provider rejected the configured credentials.' };
    }

    const errors = {
      timeout: { code: 'AI_PROVIDER_TIMEOUT', message: 'The AI service took too long to respond.' },
      http: { code: 'AI_PROVIDER_UNAVAILABLE', message: 'The AI service is temporarily unavailable.' },
      invalid_response: {
        code: 'AI_PROVIDER_INVALID_RESPONSE',
        message: 'The AI service returned an invalid response.'
      }
    } as const;
    return errors[error.reason];
  }

  return { code: 'AI_PROVIDER_UNAVAILABLE', message: 'The AI service is temporarily unavailable.' };
}

/** 将供应商异常转换为本站稳定错误码，不把上游原始响应暴露给浏览器。 */
export function throwAiApiError(error: unknown): never {
  const publicError = getPublicAiError(error);
  const status = error instanceof AiUpstreamError && error.statusCode === 402 ? 503 : 502;
  apiError(status, publicError.code, publicError.message);

  throw error;
}
