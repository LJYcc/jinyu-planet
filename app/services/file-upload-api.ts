import type { AiAttachment } from '~/types/ai-chat';
import type { ApiSuccess } from '~/types/api';

export type PostCoverUpload = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export type PostBodyImageUpload = PostCoverUpload;

/**
 * 文件上传服务只负责构造 multipart 请求和解包统一响应，不保存组件状态。
 * 浏览器只提交给本站 API；OSS 凭据始终保留在服务端。
 */
export async function uploadAiAttachment(file: File, signal?: AbortSignal) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', 'ai-attachment');

  const response = await fetch('/api/uploads', { method: 'POST', body: formData, signal });
  const payload = (await response.json()) as ApiSuccess<AiAttachment> | { success: false; message?: string };
  if (!response.ok || !payload.success) {
    throw new Error('message' in payload && payload.message ? payload.message : '文件上传失败。');
  }
  return payload.data;
}

export async function uploadPostCover(file: File, signal?: AbortSignal) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', 'post-cover');

  const response = await fetch('/api/uploads', { method: 'POST', body: formData, signal });
  const payload = (await response.json()) as ApiSuccess<PostCoverUpload> | { success: false; message?: string };
  if (!response.ok || !payload.success) {
    throw new Error('message' in payload && payload.message ? payload.message : '封面上传失败。');
  }
  return payload.data;
}

export async function uploadPostBodyImage(file: File, signal?: AbortSignal) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', 'post-image');

  const response = await fetch('/api/uploads', { method: 'POST', body: formData, signal });
  const payload = (await response.json()) as ApiSuccess<PostBodyImageUpload> | { success: false; message?: string };
  if (!response.ok || !payload.success) {
    throw new Error('message' in payload && payload.message ? payload.message : '图片上传失败。');
  }
  return payload.data;
}

export type AiDocumentPreview = {
  originalName: string;
  mimeType: string;
  content: string;
};

/** 读取当前匿名访客的文档纯文本预览，文件解析与权限校验始终由服务端处理。 */
export async function getAiDocumentPreview(attachmentId: string) {
  const payload = await $fetch<ApiSuccess<AiDocumentPreview>>(`/api/uploads/${attachmentId}/preview`);
  return payload.data;
}
