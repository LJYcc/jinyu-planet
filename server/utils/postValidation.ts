/**
 * 帖子输入验证与内容清洗工具。
 *
 * 负责校验发帖字段、清洗富文本、派生纯文本摘要和阅读时长；
 * 不负责身份认证、权限判断或数据库写入。
 */
import { randomUUID } from 'node:crypto';
import { ELEMENT_NODE, TEXT_NODE, parse, renderSync, transformSync, walkSync } from 'ultrahtml';
import sanitize from 'ultrahtml/transformers/sanitize';

const ALLOWED_TYPES = new Set(['article', 'short', 'photo', 'link']);
const ALLOWED_ELEMENTS = [
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'del',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'hr',
  'i',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul'
];
const MAX_HTML_LENGTH = 50_000;
const MAX_TEXT_LENGTH = 12_000;
const MAX_TEXT_LENGTH_BY_TYPE = {
  article: 12_000,
  short: 500,
  photo: 4_000,
  link: 2_000
} as const;
const MAX_TAGS = 5;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class PostInputError extends Error {}

export type ValidatedPostInput = {
  type: 'article' | 'short' | 'photo' | 'link';
  topicSlug: string;
  title: string | null;
  contentHtml: string;
  contentText: string;
  excerpt: string;
  externalUrl: string | null;
  tags: string[];
  clientNonce: string;
  readingMinutes: number;
  slug: string;
};

/** 创建带业务消息的帖子输入异常。 */
function inputError(message: string): never {
  throw new PostInputError(message);
}

/** 判断未知输入是否为非数组对象。 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 校验并规范化外部链接，只允许 HTTP 或 HTTPS。 */
function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/** 检查字符串中是否包含可能破坏日志或文本处理的控制字符。 */
function hasUnsafeControlCharacter(value: string) {
  return Array.from(value).some(character => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint < 32 || codePoint === 127;
  });
}

/** 从清洗后的 HTML 提取用于搜索和摘要的纯文本。 */
function plainTextFromHtml(html: string) {
  const document = parse(html);
  const fragments: string[] = [];

  walkSync(document, node => {
    if (node.type === TEXT_NODE) fragments.push(node.value);
    if (node.type === ELEMENT_NODE && (node.name === 'br' || node.name === 'hr')) fragments.push(' ');
  });

  return fragments.join('').replace(/\s+/g, ' ').trim();
}

/** 清洗富文本并派生纯文本，确保浏览器不会收到未处理的编辑器 HTML。 */
export function sanitizeEditorHtml(html: string) {
  const sanitized = transformSync(html, [
    sanitize({
      allowElements: ALLOWED_ELEMENTS,
      dropElements: ['script', 'style', 'iframe', 'object', 'embed'],
      allowAttributes: {
        href: ['a'],
        colspan: ['td', 'th'],
        rowspan: ['td', 'th']
      }
    })
  ]);
  const document = parse(sanitized);

  walkSync(document, node => {
    if (node.type !== ELEMENT_NODE || node.name !== 'a') return;
    const href = node.attributes.href;
    if (!href || !safeExternalUrl(href)) {
      delete node.attributes.href;
      return;
    }
    node.attributes.href = safeExternalUrl(href) ?? '';
  });

  const contentHtml = renderSync(document);
  return { contentHtml, contentText: plainTextFromHtml(contentHtml) };
}

/** 校验、去重并规范化帖子标签列表。 */
function validateTags(value: unknown) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_TAGS) inputError(`tags must contain at most ${MAX_TAGS} items.`);

  const uniqueTags = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') inputError('tags must be strings.');
    const tag = item.trim();
    if (!tag || tag.length > 32 || hasUnsafeControlCharacter(tag)) inputError('tags must be 1 to 32 safe characters.');
    uniqueTags.add(tag);
  }
  return [...uniqueTags];
}

/** 根据正文纯文本生成长度受限的帖子摘要。 */
function createExcerpt(contentText: string) {
  const characters = Array.from(contentText);
  return characters.length > 180 ? `${characters.slice(0, 180).join('')}...` : contentText;
}

/** 校验发帖请求并生成可直接写入数据库的派生字段。 */
export function validatePostInput(value: unknown): ValidatedPostInput {
  if (!isRecord(value)) inputError('Request body must be an object.');

  // 作者、状态和发布时间只能由服务端会话与数据库默认值决定，不能悄悄忽略
  // 这些字段，以免客户端误以为可以伪造或覆盖它们。
  const forbiddenFields = ['visitorId', 'authorId', 'status', 'publishedAt'];
  if (forbiddenFields.some(field => field in value))
    inputError('Author, status, and publication time are server controlled.');

  if (typeof value.type !== 'string' || !ALLOWED_TYPES.has(value.type)) inputError('Unsupported post type.');
  if (typeof value.topic !== 'string' || !value.topic.trim() || value.topic.trim().length > 48)
    inputError('A valid topic is required.');
  if (typeof value.contentHtml !== 'string' || value.contentHtml.length > MAX_HTML_LENGTH)
    inputError('Content is too large or invalid.');
  if (typeof value.clientNonce !== 'string' || !UUID_PATTERN.test(value.clientNonce))
    inputError('client_nonce must be a UUID.');

  const type = value.type as ValidatedPostInput['type'];
  const title = type === 'short' ? '' : typeof value.title === 'string' ? value.title.trim() : '';
  if (title.length > 160 || hasUnsafeControlCharacter(title)) inputError('title must be at most 160 safe characters.');
  if (type === 'article' && !title) inputError('Articles require a title.');
  if (type === 'link' && !title) inputError('Link posts require a title.');

  const sanitizedContent = sanitizeEditorHtml(value.contentHtml);
  const contentHtml = sanitizedContent.contentHtml;
  let contentText = sanitizedContent.contentText;
  if (type === 'link' && !contentText) contentText = title;
  if (type !== 'link' && !contentText) inputError('Content must not be empty.');
  if (contentText.length > MAX_TEXT_LENGTH || contentText.length > MAX_TEXT_LENGTH_BY_TYPE[type])
    inputError(`Content is too long for ${type} posts.`);

  const externalUrl =
    typeof value.externalUrl === 'string' && value.externalUrl.trim()
      ? safeExternalUrl(value.externalUrl.trim())
      : null;
  if (type === 'link' && !externalUrl) inputError('Link posts require a valid http or https URL.');
  if (value.externalUrl !== undefined && value.externalUrl !== null && typeof value.externalUrl !== 'string')
    inputError('external_url must be a string.');
  if (typeof value.externalUrl === 'string' && value.externalUrl.trim() && !externalUrl)
    inputError('external_url must use http or https.');

  return {
    type,
    topicSlug: value.topic.trim(),
    title: title || null,
    contentHtml,
    contentText,
    excerpt: createExcerpt(contentText),
    externalUrl,
    tags: validateTags(value.tags),
    clientNonce: value.clientNonce,
    readingMinutes: Math.max(1, Math.ceil(Array.from(contentText).length / 400)),
    slug: `signal-${randomUUID()}`
  };
}
