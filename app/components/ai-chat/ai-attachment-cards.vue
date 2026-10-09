<script setup lang="ts">
import { Close } from '@element-plus/icons-vue';
import BpmDocumentIcon from '~/assets/svg/bpm-icon.svg?component';
import PdfDocumentIcon from '~/assets/svg/pdf-icon.svg?component';
import SpreadsheetDocumentIcon from '~/assets/svg/excel-icon.svg?component';
import TextDocumentIcon from '~/assets/svg/txt-icon.svg?component';
import { getAiDocumentPreview } from '~/services/file-upload-api';
import type { AiAttachment, PendingAiAttachment } from '~/types/ai-chat';

type AttachmentCard = AiAttachment | PendingAiAttachment;

const props = withDefaults(
  defineProps<{
    attachments: AttachmentCard[];
    wrap?: boolean;
    removable?: boolean;
    showStatus?: boolean;
    disableRemove?: boolean;
  }>(),
  {
    removable: false,
    wrap: false,
    showStatus: false,
    disableRemove: false
  }
);

const emit = defineEmits<{
  remove: [id: string];
  retry: [id: string];
}>();

const isImagePreviewVisible = ref(false);
const previewImageIndex = ref(0);
const isDocumentPreviewVisible = ref(false);
const isDocumentPreviewLoading = ref(false);
const documentPreview = ref<{ originalName: string; mimeType: string; content: string }>();
const documentPreviewError = ref('');
const previewDocumentAttachment = ref<AttachmentCard>();

const imagePreviewUrls = computed(() => {
  return props.attachments
    .filter(attachment => {
      return isImageAttachment(attachment) && getAttachmentStatus(attachment) === 'uploaded';
    })
    .map(attachment => {
      return getAttachmentUrl(attachment);
    });
});

function isPendingAttachment(attachment: AttachmentCard): attachment is PendingAiAttachment {
  return 'status' in attachment;
}

function getAttachmentStatus(attachment: AttachmentCard) {
  return isPendingAttachment(attachment) ? attachment.status : 'uploaded';
}

function getAttachmentUrl(attachment: AttachmentCard) {
  if (isPendingAttachment(attachment) && attachment.previewUrl) {
    return attachment.previewUrl;
  }

  return `/api/uploads/${attachment.id}`;
}

function isImageAttachment(attachment: Pick<AiAttachment, 'mimeType'>) {
  return attachment.mimeType.startsWith('image/');
}

function isPdfAttachment(attachment: Pick<AiAttachment, 'mimeType'>) {
  return attachment.mimeType === 'application/pdf';
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocumentTypeLabel(mimeType: string) {
  if (mimeType === 'application/pdf') {
    return 'PDF';
  }

  if (mimeType === 'text/csv') {
    return 'CSV';
  }

  if (mimeType === 'text/plain') {
    return 'TXT';
  }

  return 'DOCX';
}

function getDocumentIcon(mimeType: string) {
  if (mimeType === 'application/pdf') {
    return PdfDocumentIcon;
  }

  if (mimeType === 'text/csv') {
    return SpreadsheetDocumentIcon;
  }

  if (mimeType === 'text/plain') {
    return TextDocumentIcon;
  }

  return BpmDocumentIcon;
}

function openImagePreview(attachment: AttachmentCard) {
  if (getAttachmentStatus(attachment) !== 'uploaded') {
    return;
  }

  const imageUrl = getAttachmentUrl(attachment);
  previewImageIndex.value = imagePreviewUrls.value.indexOf(imageUrl);
  isImagePreviewVisible.value = true;
}

async function openDocumentPreview(attachment: AttachmentCard) {
  if (getAttachmentStatus(attachment) !== 'uploaded') {
    return;
  }

  isDocumentPreviewVisible.value = true;
  previewDocumentAttachment.value = attachment;
  documentPreview.value = undefined;
  documentPreviewError.value = '';

  if (isPdfAttachment(attachment)) {
    return;
  }

  isDocumentPreviewLoading.value = true;
  try {
    documentPreview.value = await getAiDocumentPreview(attachment.id);
  } catch (error) {
    documentPreviewError.value = error instanceof Error ? error.message : '文档预览加载失败。';
  } finally {
    isDocumentPreviewLoading.value = false;
  }
}
</script>

<template>
  <div
    class="ai-attachment-cards"
    :class="{ 'ai-attachment-cards--wrap': props.wrap }"
  >
    <section
      v-for="attachment in props.attachments"
      :key="attachment.id"
      class="ai-attachment-cards__item"
    >
      <button
        v-if="isImageAttachment(attachment)"
        class="ai-attachment-cards__image"
        type="button"
        :disabled="getAttachmentStatus(attachment) !== 'uploaded'"
        :aria-label="`预览图片：${attachment.originalName}`"
        @click="openImagePreview(attachment)"
      >
        <img
          :src="getAttachmentUrl(attachment)"
          :alt="attachment.originalName"
        />
      </button>
      <button
        v-else
        class="ai-attachment-cards__document"
        type="button"
        :disabled="getAttachmentStatus(attachment) !== 'uploaded'"
        :aria-label="`预览文件：${attachment.originalName}`"
        @click="openDocumentPreview(attachment)"
      >
        <span class="ai-attachment-cards__document-icon">
          <component :is="getDocumentIcon(attachment.mimeType)" />
        </span>
        <span class="ai-attachment-cards__document-info">
          <span class="ai-attachment-cards__name">{{ attachment.originalName }}</span>
          <span class="ai-attachment-cards__meta"
            >{{ getDocumentTypeLabel(attachment.mimeType) }} {{ formatFileSize(attachment.sizeBytes) }}</span
          >
        </span>
      </button>
      <span
        v-if="props.showStatus && getAttachmentStatus(attachment) === 'uploading'"
        class="ai-attachment-cards__status"
        >上传中</span
      >
      <span
        v-else-if="props.showStatus && getAttachmentStatus(attachment) === 'failed'"
        class="ai-attachment-cards__status ai-attachment-cards__status--failed"
        >上传失败</span
      >
      <el-button
        v-if="props.showStatus && getAttachmentStatus(attachment) === 'failed'"
        class="ai-attachment-cards__retry"
        text
        type="primary"
        :disabled="props.disableRemove"
        @click.prevent="emit('retry', attachment.id)"
        >重试</el-button
      >
      <el-button
        v-if="props.removable"
        class="ai-attachment-cards__remove"
        text
        :disabled="props.disableRemove"
        :aria-label="`移除文件：${attachment.originalName}`"
        @click.prevent="emit('remove', attachment.id)"
        ><el-icon><close /></el-icon
      ></el-button>
    </section>
  </div>
  <el-image-viewer
    v-if="isImagePreviewVisible"
    :url-list="imagePreviewUrls"
    :initial-index="previewImageIndex"
    @close="isImagePreviewVisible = false"
  />
  <el-drawer
    v-model="isDocumentPreviewVisible"
    class="ai-attachment-cards__document-preview"
    size="80%"
    :title="previewDocumentAttachment?.originalName || '文件预览'"
    append-to-body
  >
    <iframe
      v-if="previewDocumentAttachment && isPdfAttachment(previewDocumentAttachment)"
      class="ai-attachment-cards__pdf-preview"
      :src="`/api/uploads/${previewDocumentAttachment.id}/content`"
      :title="previewDocumentAttachment.originalName"
    />
    <el-skeleton
      v-else-if="isDocumentPreviewLoading"
      :rows="12"
      animated
    />
    <el-alert
      v-else-if="documentPreviewError"
      :title="documentPreviewError"
      type="error"
      :closable="false"
    />
    <pre
      v-else-if="documentPreview"
      class="ai-attachment-cards__document-text"
      >{{ documentPreview.content }}</pre>
  </el-drawer>
</template>

<style scoped lang="scss">
:global(.el-image-viewer__mask) {
  opacity: 0.88;
}

.ai-attachment-cards {
  display: flex;
  min-width: max-content;
  align-items: center;
  gap: 8px;
}

.ai-attachment-cards--wrap {
  min-width: 0;
  flex-wrap: wrap;
}

.ai-attachment-cards__item {
  display: inline-flex;
  position: relative;
  flex: 0 0 auto;
  align-items: center;
  min-width: 0;
  border: 0;
  border-radius: 12px;
}

.ai-attachment-cards__image {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  overflow: hidden;
  padding: 0;
  border: 1px solid rgba(229, 241, 233, 0.42);
  border-radius: 14px;
  color: #dce9e2;
  background: rgba(7, 30, 34, 0.9);
  cursor: pointer;
}

.ai-attachment-cards__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ai-attachment-cards__image:hover,
.ai-attachment-cards__image:focus-visible {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(229, 199, 95, 0.2);
}

.ai-attachment-cards__document {
  display: flex;
  width: 240px;
  height: 64px;
  min-width: 0;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid rgba(229, 241, 233, 0.28);
  border-radius: 14px;
  color: #f1f5f0;
  text-align: left;
  background: rgba(7, 30, 34, 0.78);
  cursor: pointer;
}

.ai-attachment-cards__document:hover,
.ai-attachment-cards__document:focus-visible {
  border-color: rgba(229, 199, 95, 0.7);
  background: rgba(229, 199, 95, 0.1);
}

.ai-attachment-cards__document-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border-radius: 9px;
}

.ai-attachment-cards__document-icon :deep(svg) {
  width: 34px;
  height: 34px;
}

.ai-attachment-cards__document-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.ai-attachment-cards__name,
.ai-attachment-cards__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-attachment-cards__name {
  font-size: 13px;
}

.ai-attachment-cards__meta {
  color: #91a39b;
  font-size: 11px;
}

.ai-attachment-cards__status {
  position: absolute;
  right: 8px;
  bottom: 4px;
  padding: 2px 5px;
  border-radius: 4px;
  color: #e6c86a;
  font-size: 10px;
  background: rgba(7, 30, 34, 0.82);
}

.ai-attachment-cards__status--failed {
  color: #ffb4a9;
}

.ai-attachment-cards__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  margin: 0;
  padding: 0;
  border-radius: 50%;
  color: #f7faf6;
  background: rgba(16, 27, 29, 0.9);
  opacity: 0;
  visibility: hidden;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    opacity 160ms ease,
    visibility 160ms ease;
}

.ai-attachment-cards__item:hover .ai-attachment-cards__remove,
.ai-attachment-cards__item:focus-within .ai-attachment-cards__remove {
  opacity: 1;
  visibility: visible;
}

.ai-attachment-cards__remove:hover,
.ai-attachment-cards__remove:focus-visible {
  color: #ffb4a9;
  background: rgba(16, 27, 29, 1);
}

.ai-attachment-cards__retry {
  position: absolute;
  right: 26px;
  bottom: 5px;
  margin: 0;
  padding: 0 4px;
  font-size: 11px;
}

.ai-attachment-cards__document-text {
  min-height: calc(100vh - 180px);
  max-height: calc(100vh - 180px);
  margin: 0;
  overflow: auto;
  padding: 16px 20px 32px;
  border: 0;
  color: #1f2933;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 14px;
  line-height: 1.75;
  white-space: pre-wrap;
  background: #fff;
}

.ai-attachment-cards__pdf-preview {
  display: block;
  width: 100%;
  height: calc(100vh - 180px);
  border: 0;
  background: #f3f4f6;
}

.ai-attachment-cards__document-preview :deep(.el-drawer__header) {
  height: 58px;
  margin: 0;
  padding: 0 20px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2933;
  font-size: 14px;
}

.ai-attachment-cards__document-preview :deep(.el-drawer__body) {
  padding: 0;
  background: #fff;
}
</style>
