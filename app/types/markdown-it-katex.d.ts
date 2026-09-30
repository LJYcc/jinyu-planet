declare module 'markdown-it-katex' {
  import type { MarkdownIt } from 'markdown-it';

  type KatexOptions = {
    throwOnError?: boolean;
    errorColor?: string;
    displayMode?: boolean;
  };

  const markdownItKatex: (markdown: MarkdownIt, options?: KatexOptions) => void;
  export default markdownItKatex;
}
