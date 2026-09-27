/**
 * API 响应契约工具。
 *
 * 统一构造成功响应、业务错误和异常兜底响应，保持 HTTP 状态码与 JSON body
 * 同时表达错误，避免每个 API 路由重复编写 try/catch 和响应结构。
 */
import { createError, defineEventHandler, isError, setResponseStatus, type H3Event } from 'h3';

type ApiErrorData = { code?: string };

export type ApiSuccess<T, M = undefined> = {
  success: true;
  data: T;
  metadata?: M;
};

export type ApiFailure = {
  success: false;
  code: string;
  message: string;
};

/** 构造不带 metadata 的成功响应。 */
export function apiSuccess<T>(data: T): ApiSuccess<T>;
/** 构造带分页或业务辅助信息的成功响应。 */
export function apiSuccess<T, M>(data: T, metadata: M): ApiSuccess<T, M>;
/** 实际生成统一成功响应对象。 */
export function apiSuccess<T, M>(data: T, metadata?: M): ApiSuccess<T, M> {
  return metadata === undefined ? { success: true, data } : { success: true, data, metadata };
}

/** 抛出带稳定错误 code 的 H3 错误，交由统一 handler 序列化。 */
export function apiError(statusCode: number, code: string, message: string): never {
  throw createError({ statusCode, statusMessage: message, data: { code } });
}

/** 将未知异常转换为对外安全的失败响应和 HTTP 状态码。 */
function toApiFailure(error: unknown): { statusCode: number; body: ApiFailure } {
  if (isError<ApiErrorData>(error)) {
    return {
      statusCode: error.statusCode || 500,
      body: {
        success: false,
        code: error.data?.code || `HTTP_${error.statusCode || 500}`,
        message: error.statusMessage || 'Request failed.'
      }
    };
  }

  console.error(error);
  return {
    statusCode: 500,
    body: { success: false, code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' }
  };
}

/** 包装 API handler，统一处理成功结果和异常响应。 */
export function defineApiHandler(handler: (event: H3Event) => unknown | Promise<unknown>) {
  return defineEventHandler(async event => {
    try {
      return await handler(event);
    } catch (error) {
      const failure = toApiFailure(error);
      setResponseStatus(event, failure.statusCode);
      return failure.body;
    }
  });
}
