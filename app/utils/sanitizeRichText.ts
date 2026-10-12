const allowedTags = new Set([
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
]);

const styleValuePatterns: Record<string, RegExp> = {
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

function safeUrl(value: string, kind: 'link' | 'image') {
  try {
    const url = new URL(value, window.location.origin);
    const isSameOrigin = url.origin === window.location.origin;
    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
    return kind === 'link' ? isHttp || url.protocol === 'mailto:' : isHttp || isSameOrigin;
  } catch {
    return false;
  }
}

function safeInlineStyle(value: string, tagName: string) {
  const supportsDimension = new Set(['col', 'colgroup', 'img', 'video', 'table', 'td', 'th']).has(tagName);
  const allowedProperties = supportsDimension
    ? new Set(['width', 'height'])
    : new Set(Object.keys(styleValuePatterns).filter(property => property !== 'width' && property !== 'height'));

  return value
    .split(';')
    .map(declaration => declaration.trim())
    .filter(Boolean)
    .map(declaration => {
      const separator = declaration.indexOf(':');
      if (separator === -1) return null;
      const property = declaration.slice(0, separator).trim().toLowerCase();
      const styleValue = declaration.slice(separator + 1).trim();
      const pattern = styleValuePatterns[property];
      if (!allowedProperties.has(property) || !pattern || !pattern.test(styleValue)) return null;
      return `${property}: ${styleValue}`;
    })
    .filter((declaration): declaration is string => Boolean(declaration))
    .join('; ');
}

/**
 * 将服务器返回的编辑器 HTML 转换为可展示的最小安全子集。
 * 该方法只在浏览器调用，SSR 阶段不会输出未经处理的富文本。
 */
export function sanitizeRichText(html: string) {
  const source = new DOMParser().parseFromString(html, 'text/html');
  const output = document.createElement('div');

  function appendSafeNodes(from: Node, to: ParentNode) {
    for (const child of from.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        to.append(document.createTextNode(child.textContent ?? ''));
        continue;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) continue;

      const element = child as HTMLElement;
      const tag = element.tagName.toLowerCase();
      if (!allowedTags.has(tag)) {
        appendSafeNodes(element, to);
        continue;
      }

      const safeElement = document.createElement(tag);
      if (tag === 'a') {
        const href = element.getAttribute('href');
        if (href && safeUrl(href, 'link')) {
          safeElement.setAttribute('href', href);
          safeElement.setAttribute('target', '_blank');
          safeElement.setAttribute('rel', 'noopener noreferrer');
        }
      }
      if (tag === 'img' || tag === 'source' || tag === 'video') {
        const src = element.getAttribute('src');
        if (src && safeUrl(src, 'image')) safeElement.setAttribute('src', src);
        if (tag === 'img') {
          if (!src || !safeUrl(src, 'image')) continue;
          safeElement.setAttribute('alt', element.getAttribute('alt') ?? '帖子配图');
        }
        if (tag === 'video') {
          const poster = element.getAttribute('poster');
          if (poster && safeUrl(poster, 'image')) safeElement.setAttribute('poster', poster);
          if (element.hasAttribute('controls')) safeElement.setAttribute('controls', '');
          const preload = element.getAttribute('preload');
          if (preload && ['none', 'metadata', 'auto'].includes(preload)) safeElement.setAttribute('preload', preload);
        }
      }

      if (tag === 'code') {
        const className = element.getAttribute('class');
        if (className && /^language-[a-z0-9+-]+$/i.test(className)) safeElement.setAttribute('class', className);
      }

      if (tag === 'div' && element.getAttribute('class') === 'w-e-textarea-divider') {
        safeElement.setAttribute('class', 'w-e-textarea-divider');
      }

      if (tag === 'span') {
        const className = element.getAttribute('class');
        if (className && className.split(/\s+/).every(token => /^token(?:-[a-z-]+)?$|^[a-z-]+$/i.test(token))) {
          safeElement.setAttribute('class', className);
        }
      }

      if (tag === 'input') {
        if (element.getAttribute('type') !== 'checkbox') continue;
        safeElement.setAttribute('type', 'checkbox');
        if (element.hasAttribute('checked')) safeElement.setAttribute('checked', '');
        safeElement.setAttribute('disabled', '');
      }

      if (['col', 'colgroup', 'td', 'th'].includes(tag)) {
        for (const attribute of ['colspan', 'rowspan']) {
          const value = element.getAttribute(attribute);
          if (value && /^\d{1,2}$/.test(value)) safeElement.setAttribute(attribute, value);
        }
      }

      if (['table', 'col', 'colgroup'].includes(tag)) {
        const width = element.getAttribute('width');
        if (width && /^(?:\d{1,4}(?:px|%)?|auto)$/i.test(width)) safeElement.setAttribute('width', width);
      }

      if (['img', 'video'].includes(tag)) {
        for (const attribute of ['width', 'height']) {
          const value = element.getAttribute(attribute);
          if (value && /^\d{1,4}$/.test(value)) safeElement.setAttribute(attribute, value);
        }
      }

      const style = element.getAttribute('style');
      if (style) {
        const safeStyle = safeInlineStyle(style, tag);
        if (safeStyle) safeElement.setAttribute('style', safeStyle);
      }

      appendSafeNodes(element, safeElement);
      to.append(safeElement);
    }
  }

  appendSafeNodes(source.body, output);
  return output.innerHTML;
}
