<script setup lang="ts">
import { renderAiMarkdown } from '~/utils/render-ai-markdown';

const props = defineProps<{
  content: string;
  showTypingCursor?: boolean;
}>();

const contentElement = ref<HTMLElement>();
let renderTimer: ReturnType<typeof setTimeout> | undefined;
let hasInitializedMermaid = false;
const MERMAID_MIN_ZOOM = 0.5;
const MERMAID_MAX_ZOOM = 2;
const MERMAID_ZOOM_STEP = 0.1;

type MermaidDragState = {
  pointerId: number;
  viewport: HTMLElement;
  block: HTMLElement;
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
};

let mermaidDragState: MermaidDragState | undefined;

/** 将生成光标放入最后一个文本块内部，避免块级 Markdown 元素导致光标换到下一行。 */
function renderMarkdownContent() {
  const html = renderAiMarkdown(props.content);
  if (!props.showTypingCursor || !props.content) {
    return html;
  }

  const closingTags = [
    '</p>',
    '</h1>',
    '</h2>',
    '</h3>',
    '</h4>',
    '</h5>',
    '</h6>',
    '</li>',
    '</blockquote>',
    '</pre>',
    '</td>',
    '</th>'
  ];
  const closingTag = closingTags
    .map(tag => ({ tag, index: html.lastIndexOf(tag) }))
    .sort((first, second) => second.index - first.index)[0];
  if (!closingTag || closingTag.index < 0) {
    return `${html}<span class="ai-markdown-content__typing-cursor" aria-label="AI 正在输入"></span>`;
  }

  return `${html.slice(0, closingTag.index)}<span class="ai-markdown-content__typing-cursor" aria-label="AI 正在输入"></span>${html.slice(closingTag.index)}`;
}

/** 统一应用画布内 SVG 的缩放和位移，画布本身始终保持固定尺寸。 */
function applyMermaidTransform(block: HTMLElement, svg: SVGSVGElement, zoom: number) {
  const offsetX = Number(block.dataset.mermaidOffsetX) || 0;
  const offsetY = Number(block.dataset.mermaidOffsetY) || 0;
  svg.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`;
  svg.style.transformOrigin = 'center';
}

/** 在固定画布内缩放 SVG，不改变画布的尺寸或滚动范围。 */
function setMermaidZoom(block: HTMLElement, zoom: number) {
  const svg = block.querySelector<SVGSVGElement>('.ai-chat-markdown__mermaid-source svg');
  if (!svg) {
    return;
  }

  const nextZoom = Math.min(MERMAID_MAX_ZOOM, Math.max(MERMAID_MIN_ZOOM, zoom));
  const zoomValue = block.querySelector<HTMLElement>('.ai-chat-markdown__mermaid-zoom-value');
  const baseWidth = Number(svg.dataset.mermaidBaseWidth) || svg.getBoundingClientRect().width;
  const baseHeight = Number(svg.dataset.mermaidBaseHeight) || svg.getBoundingClientRect().height;
  if (!baseWidth || !baseHeight) {
    return;
  }

  // 所有缩放比例共用首次测量的基准尺寸，避免还原 100% 时回退到不同的自动布局。
  svg.dataset.mermaidBaseWidth = String(baseWidth);
  svg.dataset.mermaidBaseHeight = String(baseHeight);
  svg.style.width = `${baseWidth}px`;
  svg.style.maxWidth = 'none';
  svg.style.height = `${baseHeight}px`;
  svg.style.margin = '0';
  block.dataset.mermaidZoom = String(nextZoom);
  applyMermaidTransform(block, svg, nextZoom);
  if (zoomValue) {
    zoomValue.textContent = `${Math.round(nextZoom * 100)}%`;
  }
}

/** 将当前已安全生成的 Mermaid SVG 转换为高分辨率 PNG 并下载。 */
async function downloadMermaidPng(block: HTMLElement) {
  const svg = block.querySelector<SVGSVGElement>('.ai-chat-markdown__mermaid-source svg');
  if (!svg) {
    return;
  }

  const baseWidth = Number(svg.dataset.mermaidBaseWidth) || svg.getBoundingClientRect().width;
  const baseHeight = Number(svg.dataset.mermaidBaseHeight) || svg.getBoundingClientRect().height;
  if (!baseWidth || !baseHeight) {
    return;
  }

  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedSvg.setAttribute('width', String(baseWidth));
  clonedSvg.setAttribute('height', String(baseHeight));
  clonedSvg.style.removeProperty('transform');
  const svgBlob = new Blob([new XMLSerializer().serializeToString(clonedSvg)], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Mermaid 图表无法转换为 PNG。'));
      image.src = svgUrl;
    });

    const outputScale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(baseWidth * outputScale);
    canvas.height = Math.ceil(baseHeight * outputScale);
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Mermaid 图表无法导出为 PNG。'));
        }
      }, 'image/png');
    });
    const pngUrl = URL.createObjectURL(pngBlob);
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = 'mermaid-diagram.png';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(pngUrl), 0);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

/** 处理 Markdown 内容中动态生成的 Mermaid 工具栏事件。 */
async function handleMermaidControl(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const control = target.closest<HTMLButtonElement>('[data-mermaid-action]');
  const block = control?.closest<HTMLElement>('.ai-chat-markdown__mermaid-block');
  if (!control || !block) {
    return;
  }

  const currentZoom = Number(block.dataset.mermaidZoom) || 1;
  switch (control.dataset.mermaidAction) {
    case 'zoom-in':
      setMermaidZoom(block, currentZoom + MERMAID_ZOOM_STEP);
      break;
    case 'zoom-out':
      setMermaidZoom(block, currentZoom - MERMAID_ZOOM_STEP);
      break;
    case 'reset':
      block.dataset.mermaidOffsetX = '0';
      block.dataset.mermaidOffsetY = '0';
      setMermaidZoom(block, 1);
      break;
    case 'download':
      await downloadMermaidPng(block);
      break;
  }
}

/** 鼠标位于图表画布时直接滚轮缩放，缩放比例保持在可读范围内。 */
function handleMermaidWheel(event: WheelEvent) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const viewport = target.closest<HTMLElement>('.ai-chat-markdown__mermaid-viewport');
  const block = viewport?.closest<HTMLElement>('.ai-chat-markdown__mermaid-block');
  if (!block?.querySelector('.ai-chat-markdown__mermaid-source svg')) {
    return;
  }

  event.preventDefault();
  const currentZoom = Number(block.dataset.mermaidZoom) || 1;
  setMermaidZoom(block, currentZoom + (event.deltaY < 0 ? MERMAID_ZOOM_STEP : -MERMAID_ZOOM_STEP));
}

/** 开始拖拽画布，在固定画布内记录 SVG 位移。 */
function startMermaidDrag(event: PointerEvent) {
  if (event.button !== 0 || !(event.target instanceof Element)) {
    return;
  }

  const viewport = event.target.closest<HTMLElement>('.ai-chat-markdown__mermaid-viewport');
  const block = viewport?.closest<HTMLElement>('.ai-chat-markdown__mermaid-block');
  if (!viewport || !block) {
    return;
  }

  mermaidDragState = {
    pointerId: event.pointerId,
    viewport,
    block,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startOffsetX: Number(block.dataset.mermaidOffsetX) || 0,
    startOffsetY: Number(block.dataset.mermaidOffsetY) || 0
  };
  viewport.setPointerCapture(event.pointerId);
  viewport.classList.add('ai-chat-markdown__mermaid-viewport--dragging');
  event.preventDefault();
}

/** 根据指针移动距离更新 SVG 位移，不使用滚动条查看图表。 */
function moveMermaidDrag(event: PointerEvent) {
  if (!mermaidDragState || event.pointerId !== mermaidDragState.pointerId) {
    return;
  }

  const { block } = mermaidDragState;
  block.dataset.mermaidOffsetX = String(mermaidDragState.startOffsetX + event.clientX - mermaidDragState.startClientX);
  block.dataset.mermaidOffsetY = String(mermaidDragState.startOffsetY + event.clientY - mermaidDragState.startClientY);

  const svg = block.querySelector<SVGSVGElement>('.ai-chat-markdown__mermaid-source svg');
  if (svg) {
    applyMermaidTransform(block, svg, Number(block.dataset.mermaidZoom) || 1);
  }
}

/** 结束拖拽并释放当前画布持有的指针。 */
function stopMermaidDrag(event: PointerEvent) {
  if (!mermaidDragState || event.pointerId !== mermaidDragState.pointerId) {
    return;
  }

  const { viewport, pointerId } = mermaidDragState;
  if (viewport.hasPointerCapture(pointerId)) {
    viewport.releasePointerCapture(pointerId);
  }

  viewport.classList.remove('ai-chat-markdown__mermaid-viewport--dragging');
  mermaidDragState = undefined;
}

/** Mermaid 只能在浏览器中运行，延迟渲染可避免逐字输出时反复解析未完成的图表。 */
async function renderMermaidDiagrams() {
  if (import.meta.server || !contentElement.value) {
    return;
  }

  const diagrams = Array.from(
    contentElement.value.querySelectorAll<HTMLElement>('.ai-chat-markdown__mermaid-source')
  ).filter(diagram => !diagram.dataset.processed && !diagram.dataset.renderError);
  if (!diagrams.length) {
    return;
  }

  let mermaid: (typeof import('mermaid'))['default'];
  try {
    ({ default: mermaid } = await import('mermaid'));
  } catch {
    diagrams.forEach(diagram => {
      diagram.dataset.renderError = 'true';
    });
    return;
  }

  if (!hasInitializedMermaid) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'dark',
      themeVariables: {
        primaryColor: '#173034',
        primaryTextColor: '#edf3ed',
        primaryBorderColor: '#e0b549',
        lineColor: '#c4d0ca',
        secondaryColor: '#0d2529',
        tertiaryColor: '#102226'
      }
    });
    hasInitializedMermaid = true;
  }

  for (const diagram of diagrams) {
    const source = diagram.textContent || '';
    try {
      await mermaid.parse(source);
      await mermaid.run({ nodes: [diagram] });
      if (diagram.querySelector('.error-icon, .error-text')) {
        throw new Error('Mermaid rendered an error diagram.');
      }
    } catch {
      // Mermaid 12 可能把语法错误渲染成错误 SVG，因此统一还原源码作为降级展示。
      diagram.textContent = source;
      diagram.dataset.renderError = 'true';
    }
  }
}

/** 等待流式片段暂时稳定后再处理图表，避免每个字符都触发 Mermaid 布局计算。 */
function scheduleMermaidRender() {
  if (renderTimer) {
    clearTimeout(renderTimer);
  }

  renderTimer = setTimeout(async () => {
    await renderMermaidDiagrams();
  }, 240);
}

watch(() => props.content, scheduleMermaidRender, { flush: 'post' });
onMounted(() => {
  contentElement.value?.addEventListener('click', handleMermaidControl);
  contentElement.value?.addEventListener('wheel', handleMermaidWheel, { passive: false });
  contentElement.value?.addEventListener('pointerdown', startMermaidDrag);
  contentElement.value?.addEventListener('pointermove', moveMermaidDrag);
  contentElement.value?.addEventListener('pointerup', stopMermaidDrag);
  contentElement.value?.addEventListener('pointercancel', stopMermaidDrag);
  scheduleMermaidRender();
});
onBeforeUnmount(() => {
  if (renderTimer) {
    clearTimeout(renderTimer);
  }

  contentElement.value?.removeEventListener('click', handleMermaidControl);
  contentElement.value?.removeEventListener('wheel', handleMermaidWheel);
  contentElement.value?.removeEventListener('pointerdown', startMermaidDrag);
  contentElement.value?.removeEventListener('pointermove', moveMermaidDrag);
  contentElement.value?.removeEventListener('pointerup', stopMermaidDrag);
  contentElement.value?.removeEventListener('pointercancel', stopMermaidDrag);
});
</script>

<template>
  <div
    ref="contentElement"
    class="ai-markdown-content"
    v-html="renderMarkdownContent()"
  />
</template>

<style scoped lang="scss">
.ai-markdown-content {
  color: #edf3ed;

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 1.4em 0 0.65em;
    color: #f8fbf5;
    font-weight: 700;
    line-height: 1.35;
  }

  :deep(h1) {
    font-size: 1.3rem;
  }

  :deep(h2) {
    font-size: 1.15rem;
  }

  :deep(h3),
  :deep(h4) {
    font-size: 1rem;
  }

  :deep(h5) {
    font-size: 0.92rem;
  }

  :deep(h6) {
    font-size: 0.86rem;
  }

  :deep(h1:first-child),
  :deep(h2:first-child),
  :deep(h3:first-child),
  :deep(h4:first-child),
  :deep(h5:first-child),
  :deep(h6:first-child),
  :deep(p:first-child) {
    margin-top: 0;
  }

  :deep(p) {
    margin: 0 0 0.9em;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0 0 0.9em;
    padding-left: 1.5em;
  }

  :deep(ul) {
    list-style: disc;
  }

  :deep(ol) {
    list-style: decimal;
  }

  :deep(li + li) {
    margin-top: 0.35em;
  }

  :deep(blockquote) {
    margin: 1em 0;
    padding: 0.2em 0 0.2em 1em;
    color: #d0dcd4;
    border-left: 3px solid rgba(224, 181, 73, 0.8);
  }

  :deep(hr) {
    height: 0;
    margin: 1.6em 0;
    border: 0;
    border-top: 1px solid rgba(224, 181, 73, 0.55);
    border-bottom: 1px solid rgba(218, 235, 225, 0.1);
  }

  :deep(a) {
    color: #f0c95b;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  :deep(:not(pre) > code) {
    padding: 0.15em 0.4em;
    color: #f9dda1;
    font-size: 0.9em;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    background: rgba(1, 13, 15, 0.62);
    border-radius: 4px;
  }

  :deep(.ai-chat-markdown__code-block),
  :deep(.ai-chat-markdown__mermaid-block) {
    margin: 1.1em 0;
    overflow: hidden;
    border: 1px solid rgba(218, 235, 225, 0.3);
    border-radius: 8px;
    background: rgba(4, 18, 22, 0.94);
    box-shadow: inset 0 1px rgba(255, 255, 255, 0.04);
  }

  :deep(.ai-chat-markdown__mermaid-block) {
    border-color: rgba(218, 235, 225, 0.34);
  }

  :deep(.ai-chat-markdown__mermaid-toolbar) {
    display: flex;
    min-height: 42px;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-right: 8px;
    background: rgba(255, 255, 255, 0.035);
    border-bottom: 1px solid rgba(218, 235, 225, 0.18);
  }

  :deep(.ai-chat-markdown__code-language) {
    padding: 8px 12px;
    color: #dfe8df;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.4;
    background: rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(218, 235, 225, 0.12);
  }

  :deep(.ai-chat-markdown__mermaid-toolbar .ai-chat-markdown__code-language) {
    padding: 0 12px;
    background: transparent;
    border-bottom: 0;
  }

  :deep(.ai-chat-markdown__mermaid-controls) {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 4px;
  }

  :deep(.ai-chat-markdown__mermaid-control) {
    display: grid;
    width: 28px;
    height: 28px;
    padding: 0;
    color: #dfe8df;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    place-items: center;
  }

  :deep(.ai-chat-markdown__mermaid-control:hover),
  :deep(.ai-chat-markdown__mermaid-control:focus-visible) {
    color: #f9dda1;
    background: rgba(224, 181, 73, 0.14);
    border-color: rgba(224, 181, 73, 0.46);
    outline: none;
  }

  :deep(.ai-chat-markdown__mermaid-zoom-value) {
    min-width: 36px;
    color: #aebdb6;
    font-size: 11px;
    text-align: center;
  }

  :deep(.katex-display) {
    overflow: auto;
  }

  :deep(.ai-chat-markdown__mermaid-viewport) {
    width: 100%;
    box-sizing: border-box;
    height: min(420px, 54vh);
    min-height: 280px;
    overflow: hidden;
    cursor: grab;
    touch-action: none;
    user-select: none;
  }

  :deep(.ai-chat-markdown__mermaid-viewport--dragging) {
    cursor: grabbing;
  }

  :deep(.ai-chat-markdown__mermaid-source) {
    display: grid;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 24px;
    color: #edf3ed;
    place-items: center;
  }

  :deep(.ai-chat-markdown__mermaid-source[data-render-error='true']) {
    display: block;
    overflow-wrap: anywhere;
    color: #f5d7bf;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    line-height: 1.7;
    white-space: pre-wrap;
  }

  :deep(.ai-markdown-content__typing-cursor) {
    display: inline-block;
    width: 0.52em;
    height: 1.1em;
    margin-left: 3px;
    vertical-align: -0.16em;
    background: var(--accent);
    animation: ai-markdown-cursor-blink 0.8s step-end infinite;
  }

  @keyframes ai-markdown-cursor-blink {
    50% {
      opacity: 0;
    }
  }

  :deep(.ai-chat-markdown__mermaid-source svg) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 0;
  }

  :deep(.katex-display) {
    max-width: 100%;
    margin: 1em 0;
    overflow-y: hidden;
  }

  :deep(.ai-chat-markdown__code-block pre) {
    max-width: 100%;
    margin: 0;
    padding: 14px;
    overflow-x: auto;
    color: #eaf2e8;
    font-size: 13px;
    line-height: 1.7;
  }

  :deep(.ai-chat-markdown__code-block code) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  :deep(.hljs-keyword),
  :deep(.hljs-selector-tag),
  :deep(.hljs-literal) {
    color: #ee9b61;
  }

  :deep(.hljs-string),
  :deep(.hljs-attr),
  :deep(.hljs-title.function_) {
    color: #a9d993;
  }

  :deep(.hljs-number),
  :deep(.hljs-built_in),
  :deep(.hljs-variable) {
    color: #f0cf72;
  }

  :deep(.hljs-comment) {
    color: #849791;
  }

  :deep(.ai-chat-markdown__table-wrapper) {
    width: 100%;
    margin: 1em 0;
    overflow-x: auto;
    border: 1px solid rgba(218, 235, 225, 0.2);
    border-radius: 8px;
  }

  :deep(.ai-chat-markdown__table) {
    width: max-content;
    min-width: 100%;
    margin: 0;
    border-collapse: separate;
    border-spacing: 0;
  }

  :deep(th),
  :deep(td) {
    min-width: 104px;
    padding: 8px 10px;
    text-align: left;
    vertical-align: top;
    border-right: 1px solid rgba(218, 235, 225, 0.16);
    border-bottom: 1px solid rgba(218, 235, 225, 0.16);
  }

  :deep(th) {
    color: #f6f8f2;
    font-weight: 700;
    background: rgba(255, 255, 255, 0.06);
  }

  :deep(tr > :last-child) {
    border-right: 0;
  }

  :deep(tbody tr:last-child > *) {
    border-bottom: 0;
  }
}
</style>
