<script setup lang="ts">
import { sanitizeRichText } from '~/utils/sanitizeRichText';

const props = defineProps<{ html: string }>();
const isReady = ref(false);
const safeHtml = ref('');

function updateContent() {
  safeHtml.value = sanitizeRichText(props.html);
}

onMounted(() => {
  isReady.value = true;
  updateContent();
});

watch(
  () => props.html,
  () => {
    if (isReady.value) updateContent();
  }
);
</script>

<template>
  <div
    v-if="isReady"
    class="article-content"
    v-html="safeHtml"
  ></div>
  <p
    v-else
    class="article-content__pending"
    aria-live="polite"
  >
    正文正在准备中...
  </p>
</template>

<style scoped lang="scss">
.article-content {
  color: var(--w-e-textarea-color, #333);
  font-size: 14px;
  line-height: 1.5;
  padding-top: 20px;
}

.article-content :deep(*) {
  box-sizing: border-box;
  max-width: 100%;
}

.article-content :deep(p) {
  margin: 15px 0;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3),
.article-content :deep(h4),
.article-content :deep(h5),
.article-content :deep(h6) {
  margin: 20px 0;
  font-weight: 700;
  line-height: 1.5;
}

.article-content :deep(h1) {
  font-size: 2em;
}

.article-content :deep(h2) {
  font-size: 1.5em;
}

.article-content :deep(h3) {
  font-size: 1.17em;
}

.article-content :deep(h4) {
  font-size: 1em;
}

.article-content :deep(h5) {
  font-size: 0.83em;
}

.article-content :deep(h6) {
  font-size: 0.67em;
}

.article-content :deep(ul),
.article-content :deep(ol),
.article-content :deep(menu) {
  margin: 15px 0;
  padding: 0 0 0 40px;
  list-style: revert;
}

.article-content :deep(li) {
  margin: 0;
  padding: 0;
  line-height: 1.5;
}

.article-content :deep(blockquote) {
  margin: 10px 0;
  padding: 10px;
  border-left: 8px solid var(--w-e-textarea-selected-border-color, #b4d5ff);
  color: inherit;
  background-color: var(--w-e-textarea-slight-bg-color, #f5f2f0);
  font-size: 100%;
  line-height: 1.5;
}

.article-content :deep(.w-e-textarea-divider) {
  margin: 20px auto;
  padding: 20px;
  border-radius: 3px;
}

.article-content :deep(.w-e-textarea-divider hr) {
  display: block;
  height: 1px;
  border: 0;
  background-color: var(--w-e-textarea-border-color, #ccc);
}

/* 兼容早期已保存为裸 <hr> 的正文。 */
.article-content :deep(hr) {
  display: block;
  height: 1px;
  margin: 20px auto;
  border: 0;
  background-color: var(--w-e-textarea-border-color, #ccc);
}

.article-content :deep(a) {
  color: var(--accent-deep, #356b62);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
}

.article-content :deep(a:hover) {
  color: var(--ink, #26322f);
}

.article-content :deep(pre) {
  margin: 0;
  font-family: monospace;
  line-height: 1.5;
  white-space: pre-wrap;
}

.article-content :deep(code) {
  padding: 3px;
  border-radius: 3px;
  background-color: var(--w-e-textarea-slight-bg-color, #f5f2f0);
  font-family: monospace;
}

.article-content :deep(pre > code) {
  display: block;
  overflow: auto;
  margin: 0.5em 0;
  padding: 1em;
  border: 1px solid var(--w-e-textarea-slight-border-color, #e8e8e8);
  border-radius: 4px;
  font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  text-align: left;
  text-indent: 0;
  text-shadow: 0 1px #fff;
  white-space: pre;
  word-break: normal;
  word-spacing: normal;
  overflow-wrap: normal;
  hyphens: none;
}

.article-content :deep(pre > code .token.comment),
.article-content :deep(pre > code .token.cdata),
.article-content :deep(pre > code .token.doctype),
.article-content :deep(pre > code .token.prolog) {
  color: #708090;
}

.article-content :deep(pre > code .token.punctuation) {
  color: #999;
}

.article-content :deep(pre > code .token.boolean),
.article-content :deep(pre > code .token.constant),
.article-content :deep(pre > code .token.deleted),
.article-content :deep(pre > code .token.number),
.article-content :deep(pre > code .token.property),
.article-content :deep(pre > code .token.symbol),
.article-content :deep(pre > code .token.tag) {
  color: #905;
}

.article-content :deep(pre > code .token.attr-name),
.article-content :deep(pre > code .token.builtin),
.article-content :deep(pre > code .token.char),
.article-content :deep(pre > code .token.inserted),
.article-content :deep(pre > code .token.selector),
.article-content :deep(pre > code .token.string) {
  color: #690;
}

.article-content :deep(pre > code .token.atrule),
.article-content :deep(pre > code .token.attr-value),
.article-content :deep(pre > code .token.keyword) {
  color: #07a;
}

.article-content :deep(pre > code .token.class-name),
.article-content :deep(pre > code .token.function) {
  color: #dd4a68;
}

.article-content :deep(pre > code .token.important),
.article-content :deep(pre > code .token.regex),
.article-content :deep(pre > code .token.variable) {
  color: #e90;
}

.article-content :deep(table) {
  border-collapse: collapse;
  table-layout: fixed;
}

.article-content :deep(th),
.article-content :deep(td) {
  border: 1px solid var(--w-e-textarea-border-color, #ccc);
  line-height: 1.5;
  min-width: 30px;
  overflow: hidden;
  overflow-wrap: break-word;
  padding: 3px 5px;
  white-space: pre-wrap;
  word-break: break-all;
}

.article-content :deep(th) {
  background-color: var(--w-e-textarea-slight-bg-color, #f5f2f0);
  font-weight: 700;
  text-align: center;
}

.article-content :deep(figure) {
  max-width: 100%;
  margin: 15px 0;
}

.article-content :deep(video) {
  display: block;
  max-width: 100%;
  margin: 15px 0;
}

.article-content :deep(input[type='checkbox']) {
  margin-right: 6px;
  accent-color: var(--accent-deep, #356b62);
}

.article-content :deep(img),
.article-content :deep(video) {
  max-width: 100%;
}

.article-content__pending {
  margin: 0;
  color: var(--muted);
}
</style>
