/**
 * 上传文件安全校验。
 *
 * 客户端 Content-Type、扩展名和原始文件名都不可信；先限制允许类型与体积，再以
 * 魔数校验常见格式。文档语义解析留到 AI 附件阶段，当前校验只保证可接受的容器格式。
 */
import { createHash } from 'node:crypto';
import { apiError } from './apiResponse';

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_FILE_NAME_LENGTH = 255;
const allowedTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['application/pdf', '.pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['text/csv', '.csv'],
  ['text/plain', '.txt']
]);

export function validateUploadPart(part: { filename?: string; type?: string; data?: Buffer }) {
  const mimeType = part.type?.toLowerCase().trim();
  const data = part.data;
  if (!part.filename || !mimeType || !data?.length) apiError(400, 'INVALID_UPLOAD', 'A non-empty file is required.');
  if (data.length > MAX_UPLOAD_BYTES) apiError(413, 'UPLOAD_TOO_LARGE', 'The file must not exceed 20 MB.');
  const extension = allowedTypes.get(mimeType);
  if (!extension) apiError(415, 'UNSUPPORTED_FILE_TYPE', 'This file type is not supported.');
  // 即使浏览器声明了允许的 MIME，也必须验证文件头；避免把脚本或任意二进制伪装成图片。
  if (!hasExpectedSignature(mimeType, data))
    apiError(415, 'INVALID_FILE_SIGNATURE', 'The file content does not match its type.');

  return {
    // 原始名只用于 UI 展示，仍移除路径分隔符和 NUL，且 OSS 对象键完全不使用它。
    originalName: part.filename.slice(0, MAX_FILE_NAME_LENGTH).replace(/[\\/\0]/g, '_'),
    mimeType,
    extension,
    data,
    sizeBytes: data.length,
    checksum: createHash('sha256').update(data).digest('hex')
  };
}

function hasExpectedSignature(mimeType: string, data: Buffer) {
  if (mimeType === 'text/csv' || mimeType === 'text/plain') return data.length > 0;
  // DOCX 是 ZIP 容器；真正的 OOXML 内容将在后续文档解析阶段再做结构校验。
  if (mimeType === 'image/jpeg') return data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (mimeType === 'image/png')
    return data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === 'image/gif')
    return data.subarray(0, 6).toString('ascii') === 'GIF87a' || data.subarray(0, 6).toString('ascii') === 'GIF89a';
  if (mimeType === 'image/webp')
    return data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP';
  if (mimeType === 'application/pdf') return data.subarray(0, 5).toString('ascii') === '%PDF-';
  if (mimeType.includes('wordprocessingml')) return data.subarray(0, 2).toString('ascii') === 'PK';
  return false;
}
