/**
 * AI 文档预览接口。
 *
 * 浏览器不直读 OSS；服务端先验证附件归属和用途，再从私有对象中提取完整文本返回。
 * 全文仅用于本次预览响应，不写入数据库；模型上下文仍使用独立的受限提取结果。
 */
import { getRouterParam } from 'h3';
import { findOwnedFileAsset } from '../../../repositories/file-asset-repository';
import { extractDocumentPreviewText } from '../../../services/document-text-extractor';
import { getPrivateObject } from '../../../services/object-storage';
import { apiError, apiSuccess, defineApiHandler } from '../../../utils/apiResponse';
import { getVisitorSession } from '../../../utils/auth';

function isPreviewableDocument(mimeType: string) {
  return (
    mimeType === 'application/pdf' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'text/csv' ||
    mimeType === 'text/plain'
  );
}

export default defineApiHandler(async event => {
  const session = getVisitorSession(event);
  const assetId = getRouterParam(event, 'id');
  if (!assetId || !/^[0-9a-f-]{36}$/i.test(assetId)) {
    apiError(400, 'INVALID_FILE_ASSET_ID', 'File asset id is invalid.');
  }

  const asset = await findOwnedFileAsset(session.visitor.id, assetId);
  if (!asset || asset.purpose !== 'ai-attachment') {
    apiError(404, 'FILE_ASSET_NOT_FOUND', 'File asset was not found.');
  }
  if (!isPreviewableDocument(asset.mimeType)) {
    apiError(415, 'UNSUPPORTED_DOCUMENT_PREVIEW', 'This file cannot be previewed as a document.');
  }

  let content = '';
  try {
    content = await extractDocumentPreviewText(asset.mimeType, await getPrivateObject(asset.storageKey));
  } catch {
    apiError(422, 'DOCUMENT_PREVIEW_FAILED', 'Document text could not be extracted.');
  }

  return apiSuccess({ originalName: asset.originalName, mimeType: asset.mimeType, content });
});
