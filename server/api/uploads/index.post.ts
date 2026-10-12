/**
 * 私有文件上传接口。
 *
 * 浏览器仅向本站提交 multipart 文件；匿名会话认证、文件校验、OSS 写入和元数据
 * 持久化均在服务端完成。成功响应不包含 storageKey 或永久 URL，后续预览、AI 使用
 * 与删除操作必须再次验证附件归属，不能依赖客户端传回的对象地址。
 */
import { randomUUID } from 'node:crypto';
import { getHeader, readMultipartFormData } from 'h3';
import { apiError, apiSuccess, defineApiHandler } from '../../utils/apiResponse';
import { getVisitorSession } from '../../utils/auth';
import { createFileAsset } from '../../repositories/file-asset-repository';
import { deletePrivateObject, putPrivateObject, ObjectStorageUnavailableError } from '../../services/object-storage';
import { MAX_UPLOAD_BYTES, validateUploadPart } from '../../utils/file-upload-validation';

export default defineApiHandler(async event => {
  // API 认证中间件已在进入路由前验证 Cookie；这里只读取认证上下文，不重复解析 token。
  const session = getVisitorSession(event);
  const contentLength = Number(getHeader(event, 'content-length'));

  // 在解析 multipart 之前先拒绝明显超限的请求，给反向代理和应用层多一道体积保护。
  // 预留 1 MB 给 multipart boundary 与字段元数据；文件本身仍由 validateUploadPart 严格限制。
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES + 1024 * 1024) {
    apiError(413, 'UPLOAD_TOO_LARGE', 'The upload request is too large.');
  }

  const parts = await readMultipartFormData(event);
  const filePart = parts?.find(part => part.name === 'file' && part.filename);
  if (!filePart) {
    apiError(400, 'INVALID_UPLOAD', 'The multipart field "file" is required.');
  }

  // 校验使用声明 MIME 加魔数，而不信任文件扩展名；校验结果同时决定 OSS 对象的扩展名。
  const file = validateUploadPart(filePart);
  const purpose =
    parts
      ?.find(part => part.name === 'purpose')
      ?.data.toString('utf8')
      .trim() || 'ai-attachment';
  if (!/^[a-z0-9-]{1,32}$/.test(purpose)) {
    apiError(400, 'INVALID_UPLOAD_PURPOSE', 'The upload purpose is invalid.');
  }
  if ((purpose === 'post-cover' || purpose === 'post-image') && !file.mimeType.startsWith('image/')) {
    apiError(415, 'UNSUPPORTED_POST_IMAGE_TYPE', 'Post images must be images.');
  }

  // 不能使用用户给出的文件名组成对象路径。访客 ID 隔离归属，UUID 避免重名覆盖与路径猜测。
  const storageKey = `${purpose}/${session.visitor.id}/${randomUUID()}${file.extension}`;

  try {
    // 先上传二进制，再写数据库；数据库记录不会指向一个尚未存在的对象。
    await putPrivateObject(storageKey, file.data, file.mimeType);

    try {
      const asset = await createFileAsset({
        visitorId: session.visitor.id,
        purpose,
        storageKey,
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        checksum: file.checksum
      });

      return apiSuccess(asset);
    } catch (error) {
      // OSS 已成功而元数据失败时，主动回收孤立对象。删除失败不覆盖原始数据库错误，
      // 以便调用方仍能得到导致上传失败的真实原因。
      try {
        await deletePrivateObject(storageKey);
      } catch {
        // 无法在此处安全恢复；孤立私有对象可由后续清理任务根据存储前缀处理。
      }

      throw error;
    }
  } catch (error) {
    // 缺少服务端 OSS 配置应产生稳定的业务错误，而非向客户端泄露供应商实现细节。
    if (error instanceof ObjectStorageUnavailableError) {
      apiError(503, 'OBJECT_STORAGE_UNAVAILABLE', 'File storage is not configured.');
    }
    throw error;
  }
});
