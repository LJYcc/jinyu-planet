/**
 * 文件附件仓储。
 *
 * 附件二进制始终留在 OSS；这里仅维护可授权、可审计的元数据。后续 AI 消息和
 * 帖子图片都必须先通过 visitorId 查询附件，不能仅凭可猜测的附件 ID 使用对象。
 */
import { prisma } from '../utils/prisma';

export type FileAssetDto = {
  id: string;
  purpose: string;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

function toDto(asset: {
  id: string;
  purpose: string;
  status: FileAssetDto['status'];
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}): FileAssetDto {
  // DTO 不暴露 storageKey、校验哈希或任何签名 URL，防止普通列表接口成为文件入口。
  return { ...asset, createdAt: asset.createdAt.toISOString() };
}

export async function createFileAsset(data: {
  visitorId: string;
  purpose: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
}) {
  // 上传成功后才创建记录；如果数据库写入失败，路由会删除对应 OSS 对象以保持一致。
  const asset = await prisma.fileAsset.create({
    data,
    select: {
      id: true,
      purpose: true,
      status: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true
    }
  });
  return toDto(asset as Parameters<typeof toDto>[0]);
}

export async function findOwnedFileAsset(visitorId: string, id: string) {
  // 所有后续预览、模型读取和消息关联都复用此归属断言，防止跨匿名访客引用附件。
  return prisma.fileAsset.findFirst({ where: { id, visitorId } });
}

/**
 * 批量读取指定访客的 AI 附件。调用方必须比较返回数量与请求数量，不能把缺失或
 * 他人附件悄悄忽略后继续请求模型，否则会造成权限判断不透明。
 */
export async function findOwnedAiAttachments(visitorId: string, assetIds: string[]) {
  return prisma.fileAsset.findMany({
    where: { id: { in: assetIds }, visitorId, purpose: 'ai-attachment' },
    select: {
      id: true,
      status: true,
      storageKey: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      extractedText: true,
      extractionError: true
    }
  });
}

/** 文档文本只由服务端写回，避免浏览器伪造解析结果改变模型上下文。 */
export async function updateFileAssetExtraction(
  id: string,
  data: { status: 'ready' | 'failed'; extractedText?: string | null; extractionError?: string | null }
) {
  return prisma.fileAsset.update({ where: { id }, data });
}
