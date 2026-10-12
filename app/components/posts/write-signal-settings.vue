<script setup lang="ts">
import { Delete, DocumentChecked, RefreshRight, View, ZoomIn } from '@element-plus/icons-vue';
import type { UploadFile } from 'element-plus';
import type { PublicTopic } from '~/types/post';

const props = defineProps<{
  nickname?: string;
  topics: PublicTopic[];
  coverPreviewUrl: string;
  isCoverUploading: boolean;
  isChangingNickname: boolean;
  isSubmitting: boolean;
  canPublish: boolean;
  publishError: string;
}>();

const title = defineModel<string>('title', { required: true });
const topic = defineModel<string>('topic', { required: true });
const tags = defineModel<string[]>('tags', { required: true });

const emit = defineEmits<{
  'cover-change': [file: UploadFile];
  'preview-cover': [event: MouseEvent];
  'remove-cover': [];
  'rotate-nickname': [];
  preview: [];
  publish: [];
}>();
</script>

<template>
  <aside class="write-aside lg:order-2">
    <section class="write-side-block write-signal-settings">
      <h2>信号信息</h2>
      <p class="write-side-intro">为这段文字补充必要的信息，再将它投递到星球。</p>
      <el-form
        label-position="top"
        class="write-form"
      >
        <div class="write-identity write-identity--inline">
          <strong>{{ props.nickname || '正在生成昵称...' }}</strong>
          <el-tooltip
            content="换一个昵称"
            placement="top"
          >
            <el-button
              :icon="RefreshRight"
              circle
              text
              size="small"
              :loading="props.isChangingNickname"
              aria-label="换一个昵称"
              @click="emit('rotate-nickname')"
            />
          </el-tooltip>
        </div>
        <el-form-item
          label="标题"
          required
        >
          <el-input
            v-model="title"
            maxlength="160"
            show-word-limit
            placeholder="用一句话概括这条信号"
          />
        </el-form-item>
        <el-form-item
          label="选择主题"
          required
        >
          <el-select
            v-model="topic"
            placeholder="选择一个主题"
            class="w-full"
          >
            <el-option
              v-for="topic in props.topics"
              :key="topic.slug"
              :label="topic.name"
              :value="topic.slug"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="封面图片（可选）">
          <el-upload
            class="write-cover-upload"
            accept="image/jpeg,image/png,image/webp,image/gif"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="file => emit('cover-change', file)"
            :disabled="props.isCoverUploading"
          >
            <div
              v-if="props.coverPreviewUrl"
              class="write-cover-upload__preview"
            >
              <img
                :src="props.coverPreviewUrl"
                alt="封面预览"
              />
              <div class="write-cover-upload__mask">
                <el-button
                  circle
                  text
                  type="primary"
                  aria-label="放大预览封面"
                  @click="emit('preview-cover', $event)"
                >
                  <el-icon><zoom-in /></el-icon>
                </el-button>
                <el-button
                  circle
                  text
                  type="danger"
                  aria-label="移除封面"
                  @click.stop="emit('remove-cover')"
                >
                  <el-icon><delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div
              v-else
              class="write-cover-upload__trigger"
            >
              <span
                v-if="props.isCoverUploading"
                class="write-cover-upload__loading"
                >上传中</span
              >
              <span
                v-else
                aria-hidden="true"
                class="write-cover-upload__plus"
                >+</span
              >
            </div>
          </el-upload>
          <p class="write-field-hint">支持 JPEG、PNG、WebP、GIF，单个文件不超过 20 MB。</p>
        </el-form-item>
        <el-form-item label="添加标签">
          <el-select
            v-model="tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签后按回车"
            class="w-full"
          >
            <el-option
              v-for="tag in tags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </section>

    <div
      v-if="props.publishError"
      class="hidden lg:block"
      role="alert"
    >
      <el-alert
        :title="props.publishError"
        type="error"
        show-icon
        :closable="false"
      />
    </div>
    <div class="write-actions hidden gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid">
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

    <div class="write-meta-hints">
      <span>草稿已自动保存 · 保存在当前浏览器。</span>
      <span>请勿发布个人隐私、违法或攻击性内容。</span>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.write-aside {
  display: grid;
  align-content: start;
  gap: 18px;
}

.write-side-block h2 {
  margin: 0;
  color: var(--ink);
  font-size: 24px;
  font-weight: 700;
}

.write-side-intro {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

.write-form :deep(.el-form-item__label) {
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
}

.write-form :deep(.el-form-item) {
  margin-bottom: 25px;
}

.write-field-hint {
  width: 100%;
  margin: 9px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

.write-identity {
  display: flex;
  align-items: center;
  gap: 6px;
}

.write-identity strong {
  color: var(--ink);
  font-size: 16px;
}

.write-identity--inline {
  margin: 0 0 18px;
}

.write-actions :deep(.el-button) {
  margin: 0;
}

.write-meta-hints {
  display: grid;
  gap: 4px;
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

.write-cover-upload :deep(.el-upload) {
  display: block;
  width: 148px;
  height: 148px;
}

.write-cover-upload__trigger,
.write-cover-upload__preview {
  display: grid;
  place-items: center;
  width: 148px;
  height: 148px;
  overflow: hidden;
  border: 1px dashed #cbd1d8;
  border-radius: 5px;
  background: #fff;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.write-cover-upload :deep(.el-upload:hover) .write-cover-upload__trigger {
  border-color: var(--accent-deep);
  background: #fafcf9;
}

.write-cover-upload__plus {
  color: #8d96a1;
  font-size: 36px;
  font-weight: 200;
  line-height: 1;
}

.write-cover-upload__loading {
  color: var(--muted);
  font-size: 12px;
}

.write-cover-upload__preview {
  position: relative;
}

.write-cover-upload__preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.write-cover-upload__mask {
  display: flex;
  position: absolute;
  inset: 0;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  background: rgba(8, 18, 20, 0.56);
  opacity: 0;
  transition: opacity 0.18s ease;
}

.write-cover-upload__preview:hover .write-cover-upload__mask,
.write-cover-upload__preview:focus-within .write-cover-upload__mask {
  opacity: 1;
}

.write-cover-upload__mask :deep(.el-button) {
  width: 34px;
  height: 34px;
  margin: 0;
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
}

.write-cover-upload__mask :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 1024px) {
  .write-aside {
    padding-top: 30px;
    border-top: 1px solid var(--line);
  }
}
</style>
