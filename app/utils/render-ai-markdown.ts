import hljs from 'highlight.js/lib/common';
import ini from 'highlight.js/lib/languages/ini';
import MarkdownIt, { type RendererRule } from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';

// highlight.js 的常用语言包没有单独包含 TOML，INI 语法可覆盖其键值配置格式。
hljs.registerLanguage('toml', ini);

/** 转义 Markdown 解析器之外拼接到 HTML 中的文本。 */
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return character;
    }
  });
}

/** 判断字符是否被前面的反斜杠转义，避免把普通文本中的字面量误判为公式分隔符。 */
function isEscaped(value: string, index: number) {
  let slashCount = 0;

  for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor -= 1) {
    slashCount += 1;
  }

  return slashCount % 2 === 1;
}

/** 查找未被转义的 LaTeX 闭合分隔符。 */
function findLatexClosingDelimiter(line: string, startIndex: number, closingCharacter: string) {
  for (let index = startIndex; index < line.length - 1; index += 1) {
    if (line[index] === '\\' && line[index + 1] === closingCharacter && !isEscaped(line, index)) {
      return index;
    }
  }

  return -1;
}

/** 在非行内代码文本中统一千问常用的 LaTeX 分隔符。 */
function normalizeLatexLine(line: string) {
  let normalized = '';
  let inlineCodeDelimiter = '';

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '`') {
      let delimiterLength = 1;
      while (line[index + delimiterLength] === '`') {
        delimiterLength += 1;
      }

      const delimiter = '`'.repeat(delimiterLength);
      if (inlineCodeDelimiter === delimiter) {
        inlineCodeDelimiter = '';
      } else if (!inlineCodeDelimiter) {
        inlineCodeDelimiter = delimiter;
      }

      normalized += delimiter;
      index += delimiterLength - 1;
      continue;
    }

    if (!inlineCodeDelimiter && character === '\\' && !isEscaped(line, index)) {
      const nextCharacter = line[index + 1];
      if (nextCharacter === '(') {
        const closingIndex = findLatexClosingDelimiter(line, index + 2, ')');
        if (closingIndex >= 0) {
          normalized += `$${line.slice(index + 2, closingIndex).trim()}$`;
          index = closingIndex + 1;
          continue;
        }
      }

      if (nextCharacter === '[' || nextCharacter === ']') {
        normalized += '$$';
        index += 1;
        continue;
      }
    }

    normalized += character;
  }

  return normalized;
}

/** 保留围栏代码内容，只规范普通 Markdown 中的 LaTeX 公式分隔符。 */
function normalizeLatexDelimiters(content: string) {
  let fenceCharacter = '';

  return content
    .split(/(\r?\n)/)
    .map(part => {
      if (part === '\n' || part === '\r\n') {
        return part;
      }

      const fenceMatch = part.match(/^\s*(`{3,}|~{3,})/);
      if (fenceMatch) {
        const currentFenceCharacter = fenceMatch[1]?.[0] ?? '';
        if (!fenceCharacter) {
          fenceCharacter = currentFenceCharacter;
        } else if (fenceCharacter === currentFenceCharacter) {
          fenceCharacter = '';
        }

        return part;
      }

      return fenceCharacter ? part : normalizeLatexLine(part);
    })
    .join('');
}

/** 从代码围栏信息中取出语言名，忽略语言后的附加说明。 */
function getCodeLanguage(info: string) {
  return info.trim().split(/\s+/, 1)[0]?.toLowerCase() || '';
}

/** 为围栏代码块生成语言标签与已转义的高亮内容。 */
function renderCodeBlock(code: string, language: string): string {
  const normalizedLanguage = getCodeLanguage(language);
  const isSupportedLanguage = normalizedLanguage.length > 0 && Boolean(hljs.getLanguage(normalizedLanguage));
  const displayLanguage = isSupportedLanguage ? language : '文本';
  const renderedCode = isSupportedLanguage
    ? hljs.highlight(code, { language: normalizedLanguage, ignoreIllegals: true }).value
    : escapeHtml(code);

  return [
    '<div class="ai-chat-markdown__code-block">',
    `<div class="ai-chat-markdown__code-language">${escapeHtml(displayLanguage)}</div>`,
    `<pre><code>${renderedCode}</code></pre>`,
    '</div>'
  ].join('');
}

const markdown = new MarkdownIt({
  // AI 输出并非可信内容，原始 HTML 只按文本展示，不能直接注入页面。
  html: false,
  breaks: true,
  linkify: true
});

markdown.use(markdownItKatex, { throwOnError: false });

const renderFence: RendererRule = (tokens, index, options, _env, self) => {
  const token = tokens[index];
  if (!token) {
    return self.renderToken(tokens, index, options);
  }

  const language = getCodeLanguage(token.info);
  if (language === 'mermaid') {
    return [
      '<div class="ai-chat-markdown__mermaid-block">',
      '<div class="ai-chat-markdown__mermaid-toolbar">',
      '<div class="ai-chat-markdown__code-language">Mermaid</div>',
      '<div class="ai-chat-markdown__mermaid-controls" aria-label="图表操作">',
      '<button type="button" class="ai-chat-markdown__mermaid-control" data-mermaid-action="zoom-out" aria-label="缩小图表" title="缩小图表">−</button>',
      '<span class="ai-chat-markdown__mermaid-zoom-value" aria-live="polite">100%</span>',
      '<button type="button" class="ai-chat-markdown__mermaid-control" data-mermaid-action="zoom-in" aria-label="放大图表" title="放大图表">+</button>',
      '<button type="button" class="ai-chat-markdown__mermaid-control" data-mermaid-action="reset" aria-label="还原图表大小" title="还原图表大小">↺</button>',
      '<button type="button" class="ai-chat-markdown__mermaid-control" data-mermaid-action="download" aria-label="下载 PNG 图表" title="下载 PNG 图表">↓</button>',
      '</div>',
      '</div>',
      '<div class="ai-chat-markdown__mermaid-viewport">',
      `<div class="mermaid ai-chat-markdown__mermaid-source">${escapeHtml(token.content)}</div>`,
      '</div>',
      '</div>'
    ].join('');
  }

  return renderCodeBlock(token.content, token.info);
};

const renderLinkOpen: RendererRule = (tokens, index, options, _env, self) => {
  const token = tokens[index];
  if (!token) {
    return self.renderToken(tokens, index, options);
  }

  token.attrSet('target', '_blank');
  token.attrSet('rel', 'noopener noreferrer');
  return self.renderToken(tokens, index, options);
};

markdown.renderer.rules.link_open = renderLinkOpen;
markdown.renderer.rules.fence = renderFence;

/** 将模型 Markdown 渲染为安全 HTML，禁用原始 HTML 并转义代码内容。 */
export function renderAiMarkdown(content: string) {
  return markdown.render(normalizeLatexDelimiters(content));
}
