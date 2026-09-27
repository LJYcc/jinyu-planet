const allowedTags = new Set([
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
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
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
]);

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
      if (tag === 'img') {
        const src = element.getAttribute('src');
        if (!src || !safeUrl(src, 'image')) continue;
        safeElement.setAttribute('src', src);
        safeElement.setAttribute('alt', element.getAttribute('alt') ?? '帖子配图');
      }

      appendSafeNodes(element, safeElement);
      to.append(safeElement);
    }
  }

  appendSafeNodes(source.body, output);
  return output.innerHTML;
}
