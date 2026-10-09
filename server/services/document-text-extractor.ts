/**
 * 文档文本提取服务。
 *
 * 提取结果从不直接等同于可信指令：它只会作为带文件名边界的模型上下文。长度与段落
 * 均受限制，避免单份文件占满提示词；解析失败由调用方持久化状态供界面明确提示。
 */
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export const MAX_DOCUMENT_EXTRACTED_CHARS = 24_000;
export const DOCUMENT_CHUNK_CHARS = 3_000;

function normalizeText(value: string) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractRawDocumentText(mimeType: string, data: Buffer) {
  let extracted: string;
  if (mimeType === 'application/pdf') {
    const parser = new PDFParse({ data });
    try {
      extracted = (await parser.getText()).text;
    } finally {
      await parser.destroy();
    }
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    extracted = (await mammoth.extractRawText({ buffer: data })).value;
  } else if (mimeType === 'text/csv' || mimeType === 'text/plain') {
    extracted = data.toString('utf8');
  } else {
    throw new Error('Unsupported document type.');
  }

  const text = normalizeText(extracted);
  if (!text) {
    throw new Error('No readable text was found in the document.');
  }
  return text;
}

/**
 * 为 AI 上下文提取受限文本，结果可缓存到数据库，避免单个附件占满模型上下文。
 */
export async function extractDocumentText(mimeType: string, data: Buffer) {
  const text = await extractRawDocumentText(mimeType, data);
  return text.slice(0, MAX_DOCUMENT_EXTRACTED_CHARS);
}

/**
 * 为用户预览提取完整文本；结果不写入 extractedText，避免大文件全文进入数据库。
 */
export async function extractDocumentPreviewText(mimeType: string, data: Buffer) {
  return extractRawDocumentText(mimeType, data);
}

export function splitDocumentText(text: string) {
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += DOCUMENT_CHUNK_CHARS) {
    chunks.push(text.slice(index, index + DOCUMENT_CHUNK_CHARS));
  }
  return chunks;
}
