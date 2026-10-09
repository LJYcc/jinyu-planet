/**
 * 私有对象存储服务。
 *
 * 浏览器绝不接触 RAM AccessKey；所有写入、删除以及未来的短期读取 URL 都由
 * 服务端经此模块生成。只保存 storageKey 而非永久 URL，避免 Bucket 私有策略
 * 因数据库泄漏或对象地址被猜测而失效。
 */
import OSS from 'ali-oss';

export class ObjectStorageUnavailableError extends Error {
  constructor() {
    super('Object storage has not been configured.');
    this.name = 'ObjectStorageUnavailableError';
  }
}

function getObjectStorageClient() {
  // 配置缺失要与供应商网络故障区分，使 API 能返回“服务未配置”而非伪装成上传成功。
  const bucket = process.env.ALI_OSS_BUCKET?.trim();
  const region = process.env.ALI_OSS_REGION?.trim();
  const endpoint = process.env.ALI_OSS_ENDPOINT?.trim();
  const accessKeyId = process.env.ALI_OSS_ACCESS_KEY_ID?.trim();
  const accessKeySecret = process.env.ALI_OSS_ACCESS_KEY_SECRET?.trim();
  if (!bucket || !region || !endpoint || !accessKeyId || !accessKeySecret) {
    throw new ObjectStorageUnavailableError();
  }

  return {
    bucket,
    client: new OSS({ region, endpoint, accessKeyId, accessKeySecret, bucket, secure: true })
  };
}

export async function putPrivateObject(storageKey: string, body: Buffer, mimeType: string) {
  // key 由业务层使用访客 ID 和随机 ID 生成，不能采用客户端的文件名作为 OSS 路径。
  const { client } = getObjectStorageClient();
  await client.put(storageKey, body, { mime: mimeType });
}

export async function deletePrivateObject(storageKey: string) {
  // 元数据落库失败时由调用方回收已上传对象，避免私有 Bucket 积累孤立文件。
  const { client } = getObjectStorageClient();
  await client.delete(storageKey);
}

/** 仅供文档解析等服务端流程读取私有二进制；浏览器必须走受权的短期 URL。 */
export async function getPrivateObject(storageKey: string) {
  const { client } = getObjectStorageClient();
  const result = await client.get(storageKey);
  return Buffer.isBuffer(result.content) ? result.content : Buffer.from(result.content);
}

/** 仅供服务端调用模型或生成短期预览，不作为永久公开 URL 保存。 */
export function createPrivateObjectUrl(storageKey: string, expires = 300) {
  const { client } = getObjectStorageClient();
  return client.signatureUrl(storageKey, { expires, response: { 'content-disposition': 'inline' } });
}
