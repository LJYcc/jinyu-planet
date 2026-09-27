/**
 * HTTP 请求体读取工具。
 *
 * 只负责 JSON 解析和请求体格式错误；具体字段规则交给领域验证模块。
 */
import { readBody, type H3Event } from 'h3';
import { apiError } from './apiResponse';

/** 读取 JSON 请求体，并将解析失败转换为统一的 400 错误。 */
export async function readJsonBody<T>(event: H3Event): Promise<T> {
  try {
    return ((await readBody<T>(event)) ?? {}) as T;
  } catch {
    apiError(400, 'INVALID_REQUEST_BODY', 'Invalid request body.');
  }
}
