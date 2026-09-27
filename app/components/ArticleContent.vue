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
  color: #303938;
  font-size: 16px;
  line-height: 2;

  :deep(*) {
    max-width: 100%;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 2em 0 0.65em;
    color: var(--ink);
    font-weight: 700;
    line-height: 1.35;
  }

  :deep(h1) {
    font-size: 30px;
  }
  :deep(h2) {
    font-size: 25px;
  }
  :deep(h3) {
    font-size: 21px;
  }

  :deep(p),
  :deep(ul),
  :deep(ol),
  :deep(blockquote),
  :deep(pre),
  :deep(figure),
  :deep(table) {
    margin: 0 0 1.45em;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 1.55em;
  }
  :deep(li + li) {
    margin-top: 0.35em;
  }

  :deep(a) {
    color: var(--accent-deep);
    font-weight: 700;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }

  :deep(blockquote) {
    padding: 0.3em 1.1em;
    border-left: 3px solid var(--accent);
    color: #59635f;
  }

  :deep(pre) {
    overflow-x: auto;
    padding: 18px 20px;
    color: #edf4ef;
    background: var(--night);
    font-family: 'Source Sans 3', ui-monospace, monospace;
    line-height: 1.65;
  }

  :deep(code) {
    padding: 0.08em 0.35em;
    background: #e5e9e3;
    font-family: 'Source Sans 3', ui-monospace, monospace;
  }

  :deep(pre code) {
    padding: 0;
    background: transparent;
  }

  :deep(img) {
    display: block;
    width: auto;
    max-height: 720px;
    margin: 1.8em auto;
    object-fit: contain;
  }

  :deep(figure) {
    margin-right: 0;
    margin-left: 0;
  }
  :deep(figcaption) {
    margin-top: -1em;
    color: var(--muted);
    font-size: 13px;
    text-align: center;
  }

  :deep(table) {
    display: block;
    overflow-x: auto;
    border-collapse: collapse;
  }
  :deep(th),
  :deep(td) {
    min-width: 110px;
    padding: 9px 12px;
    border: 1px solid var(--line);
    text-align: left;
  }
  :deep(th) {
    background: #e9ece7;
  }
}

.article-content__pending {
  margin: 0;
  color: var(--muted);
}

@media (max-width: 820px) {
  .article-content {
    font-size: 15px;
  }
  .article-content :deep(h1) {
    font-size: 27px;
  }
  .article-content :deep(h2) {
    font-size: 23px;
  }
}
</style>
