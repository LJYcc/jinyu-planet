/**
 * 帖子输入验证与内容清洗工具。
 *
 * 负责校验发帖字段、清洗富文本、派生纯文本摘要和阅读时长；
 * 不负责身份认证、权限判断或数据库写入。
 */
import { randomUUID } from 'node:crypto';
import { ELEMENT_NODE, TEXT_NODE, parse, renderSync, transformSync, walkSync } from 'ultrahtml';
import sanitize from 'ultrahtml/transformers/sanitize';

const ALLOWED_ELEMENTS = [
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'col',
  'colgroup',
  'del',
  'div',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'input',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
  'video',
  'source'
];
const MAX_HTML_LENGTH = 50_000;
const MAX_TEXT_LENGTH = 12_000;
const MAX_TAGS = 5;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class PostInputError extends Error {}

export type ValidatedPostInput = {
  type: 'article';
  topicSlug: string;
  title: string | null;
  contentHtml: string;
  contentText: string;
  excerpt: string;
  externalUrl: string | null;
  coverAssetId: string | null;
  bodyImageAssetIds: string[];
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

function safeMediaUrl(value: string) {
  if (/^\/api\/(?:uploads|posts)\//.test(value)) return value;
  return safeExternalUrl(value);
}

const STYLE_VALUE_PATTERNS: Record<string, RegExp> = {
  color: /^(?:#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([\d.%\s,/+-]+\)|[a-z]+)$/i,
  'background-color': /^(?:#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([\d.%\s,/+-]+\)|[a-z]+)$/i,
  'font-size': /^\d+(?:\.\d+)?(?:px|em|rem|%)$/i,
  'font-family': /^[\p{L}\p{N}\s,'"-]{1,160}$/u,
  'line-height': /^\d+(?:\.\d+)?(?:px|em|rem|%)?$/i,
  'text-align': /^(?:left|right|center|justify)$/i,
  'text-indent': /^\d+(?:\.\d+)?(?:px|em|rem|%)$/i,
  width: /^\d+(?:\.\d+)?(?:px|%)$/i,
  height: /^\d+(?:\.\d+)?(?:px|%)$/i,
  'text-decoration-line': /^underline$/i,
  'text-decoration-style': /^wavy$/i,
  'text-underline-offset': /^\d+(?:\.\d+)?(?:px|em|rem)$/i,
  'text-emphasis-style': /^filled dot$/i,
  'text-emphasis-position': /^under left$/i
};

function safeInlineStyle(value: string, tagName: string) {
  const supportsDimension = new Set(['col', 'colgroup', 'img', 'video', 'table', 'td', 'th']).has(tagName);
  const allowedProperties = supportsDimension
    ? new Set(['width', 'height'])
    : new Set(Object.keys(STYLE_VALUE_PATTERNS).filter(property => property !== 'width' && property !== 'height'));

  return value
    .split(';')
    .map(declaration => declaration.trim())
    .filter(Boolean)
    .map(declaration => {
      const separator = declaration.indexOf(':');
      if (separator === -1) return null;
      const property = declaration.slice(0, separator).trim().toLowerCase();
      const styleValue = declaration.slice(separator + 1).trim();
      const pattern = STYLE_VALUE_PATTERNS[property];
      if (!allowedProperties.has(property) || !pattern || !pattern.test(styleValue)) return null;
      return `${property}: ${styleValue}`;
    })
    .filter((declaration): declaration is string => Boolean(declaration))
    .join('; ');
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
        src: ['img', 'source', 'video'],
        alt: ['img'],
        class: ['code', 'div', 'span'],
        type: ['input'],
        checked: ['input'],
        disabled: ['input'],
        controls: ['video'],
        poster: ['video'],
        preload: ['video'],
        style: [
          'span',
          'p',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'li',
          'ol',
          'ul',
          'blockquote',
          'pre',
          'code',
          'table',
          'colgroup',
          'col',
          'thead',
          'tbody',
          'tr',
          'th',
          'td',
          'img',
          'video'
        ],
        width: ['img', 'video', 'table', 'colgroup', 'col'],
        height: ['img', 'video'],
        colspan: ['td', 'th'],
        rowspan: ['td', 'th']
      }
    })
  ]);
  const document = parse(sanitized);

  walkSync(document, node => {
    if (node.type !== ELEMENT_NODE) return;

    if (node.attributes.style) {
      const style = safeInlineStyle(node.attributes.style, node.name);
      if (style) node.attributes.style = style;
      else delete node.attributes.style;
    }

    if (node.attributes.class) {
      const className = node.attributes.class;
      const isCodeClass = node.name === 'code' && /^language-[a-z0-9+-]+$/i.test(className);
      const isDividerClass = node.name === 'div' && className === 'w-e-textarea-divider';
      const isTokenClass =
        node.name === 'span' && className.split(/\s+/).every(token => /^token(?:-[a-z-]+)?$|^[a-z-]+$/i.test(token));
      if (!isCodeClass && !isDividerClass && !isTokenClass) delete node.attributes.class;
    }

    if (node.name === 'table' || node.name === 'col' || node.name === 'colgroup') {
      const width = node.attributes.width;
      if (width && !/^(?:\d{1,4}(?:px|%)?|auto)$/i.test(width)) delete node.attributes.width;
    }

    if (node.name === 'input') {
      if (node.attributes.type !== 'checkbox') {
        node.name = 'span';
        delete node.attributes.type;
        delete node.attributes.checked;
        delete node.attributes.disabled;
      } else {
        if (node.attributes.checked !== undefined) node.attributes.checked = '';
        node.attributes.disabled = '';
      }
    }

    if (node.name === 'a') {
      const href = node.attributes.href;
      if (!href || !safeExternalUrl(href)) delete node.attributes.href;
      else node.attributes.href = safeExternalUrl(href) ?? '';
    }

    if (node.name === 'img' || node.name === 'source' || node.name === 'video') {
      const src = node.attributes.src;
      if (src && !safeMediaUrl(src)) delete node.attributes.src;
    }

    if (node.name === 'video' && node.attributes.poster && !safeMediaUrl(node.attributes.poster)) {
      delete node.attributes.poster;
    }
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

  if (typeof value.topic !== 'string' || !value.topic.trim() || value.topic.trim().length > 48)
    inputError('A valid topic is required.');
  if (typeof value.contentHtml !== 'string' || value.contentHtml.length > MAX_HTML_LENGTH)
    inputError('Content is too large or invalid.');
  if (typeof value.clientNonce !== 'string' || !UUID_PATTERN.test(value.clientNonce))
    inputError('client_nonce must be a UUID.');

  const title = typeof value.title === 'string' ? value.title.trim() : '';
  if (title.length > 160 || hasUnsafeControlCharacter(title)) inputError('title must be at most 160 safe characters.');
  if (!title) inputError('A title is required.');

  const sanitizedContent = sanitizeEditorHtml(value.contentHtml);
  const contentHtml = sanitizedContent.contentHtml;
  const contentText = sanitizedContent.contentText;
  if (!contentText) inputError('Content must not be empty.');
  if (contentText.length > MAX_TEXT_LENGTH) inputError('Content is too long.');

  const coverAssetId = value.coverAssetId === undefined || value.coverAssetId === null ? null : value.coverAssetId;
  if (coverAssetId !== null && (typeof coverAssetId !== 'string' || !UUID_PATTERN.test(coverAssetId)))
    inputError('cover_asset_id must be a UUID.');

  if (!Array.isArray(value.bodyImageAssetIds) || value.bodyImageAssetIds.length > 10)
    inputError('body_image_asset_ids must contain at most 10 items.');
  const bodyImageAssetIds = [...new Set(value.bodyImageAssetIds)];
  if (bodyImageAssetIds.some(id => typeof id !== 'string' || !UUID_PATTERN.test(id)))
    inputError('body_image_asset_ids must only contain UUIDs.');

  return {
    type: 'article',
    topicSlug: value.topic.trim(),
    title,
    contentHtml,
    contentText,
    excerpt: createExcerpt(contentText),
    externalUrl: null,
    coverAssetId,
    bodyImageAssetIds,
    tags: validateTags(value.tags),
    clientNonce: value.clientNonce,
    readingMinutes: Math.max(1, Math.ceil(Array.from(contentText).length / 400)),
    slug: `signal-${randomUUID()}`
  };
}
