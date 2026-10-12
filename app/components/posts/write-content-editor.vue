<script setup lang="ts">
import { DocumentChecked, View } from '@element-plus/icons-vue';
import PostEditor from '~/components/posts/post-editor.vue';

const props = defineProps<{
  contentLength: number;
  publishError: string;
  canPublish: boolean;
  isSubmitting: boolean;
}>();

const contentHtml = defineModel<string>('contentHtml', { required: true });

const emit = defineEmits<{
  'image-uploaded': [assetId: string];
  preview: [];
  publish: [];
}>();
</script>

<template>
  <main class="write-main lg:order-1">
    <div class="write-section-title flex items-end justify-between gap-4">
      <h2>正文</h2>
      <p>让思绪从这里慢慢展开。</p>
    </div>
    <el-form
      label-position="top"
      class="write-form"
    >
      <el-form-item class="write-editor-item">
        <post-editor
          v-model="contentHtml"
          placeholder="写下想被读到的想法、故事或发现；可使用工具栏插入链接。"
          @image-uploaded="emit('image-uploaded', $event)"
        />
        <p class="write-field-hint">{{ props.contentLength }} / 12000 字，摘要会由系统自动生成。</p>
      </el-form-item>
    </el-form>

    <div
      v-if="props.publishError"
      class="mb-5 lg:hidden"
      role="alert"
    >
      <el-alert
        :title="props.publishError"
        type="error"
        show-icon
        :closable="false"
      />
    </div>
    <div class="write-actions grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:hidden">
      <el-button
        :icon="View"
        size="large"
        @click="emit('preview')"
        >预览</el-button
      >
      <el-button
        type="primary"
        :icon="DocumentChecked"
        size="large"
        :loading="props.isSubmitting"
        :disabled="!props.canPublish"
        @click="emit('publish')"
      >
        投递到金鱼星球
      </el-button>
    </div>
  </main>
</template>

<style scoped lang="scss">
.write-main {
  min-width: 0;
  padding-right: 34px;
  border-right: 1px solid var(--line);
}

.write-main :deep(.w-e-text-container),
.write-main :deep(.post-editor__fallback) {
  height: clamp(540px, calc(100vh - 260px), 688px);
  min-height: 0;
}

.write-section-title {
  margin-bottom: 16px;
}

.write-section-title h2 {
  margin: 0;
  color: var(--ink);
  font-size: 24px;
  font-weight: 700;
}

.write-section-title p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

.write-editor-item {
  margin-bottom: 0 !important;
}

.write-field-hint {
  width: 100%;
  margin: 9px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

.write-actions :deep(.el-button) {
  margin: 0;
}

@media (max-width: 1024px) {
  .write-main {
    padding-right: 0;
    border-right: 0;
  }

  .write-main :deep(.w-e-text-container),
  .write-main :deep(.post-editor__fallback) {
    height: 460px;
  }
}

@media (max-width: 640px) {
  .write-section-title {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .write-main :deep(.w-e-text-container),
  .write-main :deep(.post-editor__fallback) {
    height: 420px;
  }
}
</style>
