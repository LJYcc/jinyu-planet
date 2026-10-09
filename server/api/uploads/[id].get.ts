/**
 * 私有文件读取入口。
 *
 * 页面始终访问本站受保护路由，路由先确认当前匿名访客拥有附件，才将浏览器重定向到
 * 有效期很短的 OSS 签名 URL。这样私有对象不需要公开读权限，也不在消息数据库保存 URL。
 */
import { getRouterParam, sendRedirect } from 'h3';
import { apiError, defineApiHandler } from '../../utils/apiResponse';
import { getVisitorSession } from '../../utils/auth';
import { findOwnedFileAsset } from '../../repositories/file-asset-repository';
import { createPrivateObjectUrl } from '../../services/object-storage';

export default defineApiHandler(async event => {
  const session = getVisitorSession(event);
  const assetId = getRouterParam(event, 'id');
  if (!assetId || !/^[0-9a-f-]{36}$/i.test(assetId)) {
    apiError(400, 'INVALID_FILE_ASSET_ID', 'File asset id is invalid.');
  }

  const asset = await findOwnedFileAsset(session.visitor.id, assetId);
  if (!asset) {
    apiError(404, 'FILE_ASSET_NOT_FOUND', 'File asset was not found.');
  }

  return sendRedirect(event, createPrivateObjectUrl(asset.storageKey), 302);
});
