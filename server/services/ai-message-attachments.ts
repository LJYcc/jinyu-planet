/**
 * AI 消息附件适配器。
 *
 * 这里是附件权限已完成验证之后，向模型转换内容的唯一位置：图片使用只在短时间内
 * 有效的服务端签名 URL；文档二进制从私有 OSS 读取、提取文本并写回附件记录。浏览器
 * 和模型请求体均不会取得 RAM 凭据或永久 OSS 地址。
 */
import { apiError } from '../utils/apiResponse';
import { extractDocumentText, splitDocumentText } from './document-text-extractor';
import { createPrivateObjectUrl, getPrivateObject } from './object-storage';
import { updateFileAssetExtraction } from '../repositories/file-asset-repository';
import type { AiModelMessage } from './ai-client';

type OwnedAttachment = {
  id: string;
  storageKey: string;
  originalName: string;
  mimeType: string;
  extractedText: string | null;
};

function isImage(mimeType: string) {
  return mimeType.startsWith('image/');
}

function isDocument(mimeType: string) {
  return (
    mimeType === 'application/pdf' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'text/csv' ||
    mimeType === 'text/plain'
  );
}

/** 将已归属当前访客的附件转换成千问需要的图片 URL 或受限文档文本。 */
export async function toAiMessageAttachments(
  attachments: OwnedAttachment[]
): Promise<NonNullable<AiModelMessage['attachments']>> {
  const modelAttachments: NonNullable<AiModelMessage['attachments']> = [];

  for (const attachment of attachments) {
    if (isImage(attachment.mimeType)) {
      // URL 仅供当前一次模型调用读取，五分钟后失效；数据库不会保存此 URL。
      modelAttachments.push({ type: 'image', url: createPrivateObjectUrl(attachment.storageKey) });
      continue;
    }

    if (!isDocument(attachment.mimeType)) {
      apiError(415, 'UNSUPPORTED_AI_ATTACHMENT', 'This attachment cannot be used in an AI message.');
    }

    let extractedText = attachment.extractedText;
    if (!extractedText) {
      try {
        const data = await getPrivateObject(attachment.storageKey);
        extractedText = await extractDocumentText(attachment.mimeType, data);
        await updateFileAssetExtraction(attachment.id, { status: 'ready', extractedText, extractionError: null });
      } catch {
        await updateFileAssetExtraction(attachment.id, {
          status: 'failed',
          extractionError: '文档文本提取失败，请检查文件是否完整且未加密。'
        });
        apiError(422, 'AI_DOCUMENT_EXTRACTION_FAILED', 'Document text could not be extracted.');
      }
    }

    // 每个片段都有同一文件名边界，模型能辨认来源；总长度已由提取器严格限制。
    const chunks = splitDocumentText(extractedText);
    for (const text of chunks) {
      modelAttachments.push({ type: 'document', name: attachment.originalName, text });
    }
  }

  return modelAttachments;
}
