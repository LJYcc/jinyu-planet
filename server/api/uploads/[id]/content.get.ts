/**
 * 私有附件原始内容预览入口。
 *
 * PDF 预览需要保留页面排版，不能使用供 AI 上下文的纯文本提取结果。此接口在服务端
 * 校验附件归属后代理返回 PDF 二进制，使浏览器可以在本站受保护路径内以内嵌方式渲染。
 */
import { getRouterParam, setHeader } from 'h3';
import { findOwnedFileAsset } from '../../../repositories/file-asset-repository';
import { getPrivateObject } from '../../../services/object-storage';
import { apiError, defineApiHandler } from '../../../utils/apiResponse';
import { getVisitorSession } from '../../../utils/auth';

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
  if (asset.mimeType !== 'application/pdf') {
    apiError(415, 'UNSUPPORTED_FILE_CONTENT_PREVIEW', 'This file cannot be previewed as original content.');
  }

  setHeader(event, 'content-type', 'application/pdf');
  setHeader(event, 'content-disposition', 'inline');
  setHeader(event, 'cache-control', 'private, no-store');
  setHeader(event, 'x-content-type-options', 'nosniff');
  return getPrivateObject(asset.storageKey);
});
