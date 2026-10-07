<script setup lang="ts">
import { Link as LinkIcon, Search } from '@element-plus/icons-vue';
import type { AiSearchSource } from '~/types/ai-chat';

const props = defineProps<{
  sources: AiSearchSource[];
}>();

const isDrawerOpen = ref(false);

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
</script>

<template>
  <div
    v-if="props.sources.length"
    class="ai-search-sources"
  >
    <el-button
      class="ai-search-sources__trigger"
      text
      :icon="Search"
      @click="isDrawerOpen = true"
    >
      已搜索 {{ props.sources.length }} 个网页
    </el-button>

    <el-drawer
      v-model="isDrawerOpen"
      class="ai-search-sources__drawer"
      title="搜索结果"
      direction="rtl"
      size="min(420px, 92vw)"
      append-to-body
    >
      <div class="ai-search-sources__list">
        <article
          v-for="source in props.sources"
          :key="source.id"
          class="ai-search-sources__item"
        >
          <p class="ai-search-sources__meta">
            <el-icon><link-icon /></el-icon>
            <span>{{ getDomain(source.url) }}</span>
          </p>
          <a
            class="ai-search-sources__title"
            :href="source.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ source.title }}
          </a>
          <p
            v-if="source.snippet"
            class="ai-search-sources__snippet"
          >
            {{ source.snippet }}
          </p>
        </article>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.ai-search-sources {
  margin-top: 10px;
}

.ai-search-sources__trigger {
  --el-button-text-color: #cce0d7;
  --el-button-hover-text-color: #f4fff9;
  --el-button-hover-bg-color: rgba(45, 128, 111, 0.26);
  --el-button-hover-border-color: rgba(121, 213, 189, 0.72);
  height: 28px;
  padding: 0 10px;
  border: 1px solid rgba(173, 204, 196, 0.28);
  border-radius: 999px;
  color: #cce0d7;
  font-size: 12px;
  background: rgba(218, 235, 225, 0.08);
}

.ai-search-sources__trigger.el-button:hover,
.ai-search-sources__trigger.el-button:focus-visible,
.ai-search-sources__trigger.el-button.is-text:hover,
.ai-search-sources__trigger.el-button.is-text:focus-visible {
  border-color: rgba(121, 213, 189, 0.72);
  color: #f4fff9;
  background: rgba(45, 128, 111, 0.26) !important;
}

.ai-search-sources__trigger :deep(.el-icon) {
  color: currentColor;
}

:global(.ai-search-sources__drawer) {
  --el-drawer-bg-color: #0b2023;
  --el-text-color-primary: #edf3ed;
  --el-text-color-regular: #bfcec7;
}

:global(.ai-search-sources__drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(218, 235, 225, 0.18);
  color: #edf3ed;
  font-size: 15px;
  font-weight: 700;
}

:global(.ai-search-sources__drawer .el-drawer__close-btn) {
  color: #bed0c8;
}

:global(.ai-search-sources__drawer .el-drawer__body) {
  padding: 0 20px 22px;
  overflow-y: auto;
  scrollbar-color: rgba(224, 181, 73, 0.58) transparent;
  scrollbar-width: thin;
}

.ai-search-sources__list {
  display: grid;
}

.ai-search-sources__item {
  padding: 18px 0;
  border-bottom: 1px solid rgba(218, 235, 225, 0.14);
}

.ai-search-sources__item:last-child {
  border-bottom: 0;
}

.ai-search-sources__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 7px;
  color: #98b6aa;
  font-size: 12px;
}

.ai-search-sources__meta :deep(.el-icon) {
  color: #79d5bd;
}

.ai-search-sources__title {
  display: block;
  color: #edf5ef;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.45;
  text-decoration: none;
}

.ai-search-sources__title:hover,
.ai-search-sources__title:focus-visible {
  color: #8fe2cb;
  outline: none;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.ai-search-sources__snippet {
  display: -webkit-box;
  margin: 7px 0 0;
  overflow: hidden;
  color: #b7c9c0;
  font-size: 13px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
</style>
