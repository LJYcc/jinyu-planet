<script setup lang="ts">
import { ArrowLeft, ArrowRight, MagicStick, Paperclip, Promotion, Search, VideoPause } from '@element-plus/icons-vue';
import AiAttachmentCards from '~/components/ai-chat/ai-attachment-cards.vue';
import type { PendingAiAttachment } from '~/types/ai-chat';
import { uploadAiAttachment } from '~/services/file-upload-api';

// 输入框内部只处理输入体验（Enter 发送、Shift+Enter 换行、停止按钮）。
// 实际发送请求仍由父组件执行，因此这里不会重复实现 AI 请求逻辑。
const props = defineProps<{
  isSending: boolean;
  disabled?: boolean;
  deepThinkingAvailable?: boolean;
  webSearchAvailable?: boolean;
}>();

const input = defineModel<string>({ required: true });
const deepThinking = defineModel<boolean>('deepThinking', { default: false });
const webSearch = defineModel<boolean>('webSearch', { default: false });
const attachments = defineModel<PendingAiAttachment[]>('attachments', { default: () => [] });
const attachmentsViewport = ref<HTMLElement>();
const canScrollAttachmentsLeft = ref(false);
const canScrollAttachmentsRight = ref(false);
let attachmentsResizeObserver: ResizeObserver | undefined;

function sendMessage() {
  const hasUploadedAttachment = attachments.value.some(attachment => attachment.status === 'uploaded');
  const hasUploadingAttachment = attachments.value.some(attachment => attachment.status === 'uploading');
  const hasFailedAttachment = attachments.value.some(attachment => attachment.status === 'failed');
  if (
    !props.disabled &&
    !hasUploadingAttachment &&
    !hasFailedAttachment &&
    (input.value.trim() || hasUploadedAttachment)
  ) {
    emit('send');
  }
}

function handleComposerKeydown(event: Event) {
  if (!(event instanceof KeyboardEvent)) {
    return;
  }
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

function selectFiles() {
  if (!props.disabled && !props.isSending) {
    fileInput.value?.click();
  }
}

const fileInput = ref<HTMLInputElement>();

const emit = defineEmits<{
  send: [];
  stop: [];
}>();

/**
 * 输入框负责附件选择、上传、失败重试和移除；附件数组仍通过 v-model 归父级持有，
 * 以便页面控制器在发送、消息重试和切换会话时能够读取或整体清空待发送附件。
 */
async function uploadAttachment(file: File, localId = `pending-${crypto.randomUUID()}`) {
  const existingAttachment = attachments.value.find(attachment => attachment.id === localId);
  if (existingAttachment) {
    existingAttachment.status = 'uploading';
    existingAttachment.error = undefined;
  } else {
    attachments.value = [
      ...attachments.value,
      {
        id: localId,
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        status: 'uploading',
        file,
        previewUrl: isImageAttachment({ mimeType: file.type }) ? URL.createObjectURL(file) : undefined
      }
    ];
  }

  try {
    const uploaded = await uploadAiAttachment(file);
    const attachment = attachments.value.find(item => item.id === localId);
    if (attachment) {
      Object.assign(attachment, uploaded, { status: 'uploaded', error: undefined, file: undefined });
    }
  } catch (error) {
    const attachment = attachments.value.find(item => item.id === localId);
    if (attachment) {
      attachment.status = 'failed';
      attachment.error = error instanceof Error ? error.message : '文件上传失败。';
    }
  }
}

async function handleFileChange(event: Event) {
  const inputElement = event.target as HTMLInputElement;
  const files = Array.from(inputElement.files ?? []);
  const availableSlots = 6 - attachments.value.length;
  for (const file of files.slice(0, availableSlots)) {
    await uploadAttachment(file);
  }
  inputElement.value = '';
}

function removeAttachment(id: string) {
  const attachment = attachments.value.find(item => item.id === id);
  if (attachment?.previewUrl) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
  attachments.value = attachments.value.filter(attachment => attachment.id !== id);
}

function updateAttachmentScrollState() {
  const viewport = attachmentsViewport.value;
  if (!viewport) {
    return;
  }

  canScrollAttachmentsLeft.value = viewport.scrollLeft > 1;
  canScrollAttachmentsRight.value = viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1;
}

function scheduleAttachmentScrollStateUpdate() {
  nextTick(() => {
    const viewport = attachmentsViewport.value;
    if (!viewport) {
      return;
    }

    if (!attachmentsResizeObserver) {
      attachmentsResizeObserver = new ResizeObserver(updateAttachmentScrollState);
      attachmentsResizeObserver.observe(viewport);
    }

    requestAnimationFrame(updateAttachmentScrollState);
  });
}

function scrollAttachments(direction: 'left' | 'right') {
  attachmentsViewport.value?.scrollBy({
    left: direction === 'left' ? -100 : 100,
    behavior: 'smooth'
  });
}

async function retryAttachment(id: string) {
  const attachment = attachments.value.find(item => item.id === id);
  if (attachment?.file) {
    await uploadAttachment(attachment.file, id);
  }
}

function isImageAttachment(attachment: Pick<PendingAiAttachment, 'mimeType'>) {
  return attachment.mimeType.startsWith('image/');
}

watch(
  () => attachments.value.length,
  () => {
    scheduleAttachmentScrollStateUpdate();
  },
  { flush: 'post' }
);

onMounted(() => {
  scheduleAttachmentScrollStateUpdate();
});

onBeforeUnmount(() => {
  attachmentsResizeObserver?.disconnect();

  attachments.value.forEach(attachment => {
    if (attachment.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
  });
});
</script>

<template>
  <div class="ai-chat-composer-wrap">
    <form
      class="ai-chat-composer"
      :class="{ 'ai-chat-composer--has-attachments': attachments.length }"
      @submit.prevent="sendMessage"
    >
      <input
        ref="fileInput"
        class="ai-chat-composer__file-input"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,.csv,text/plain,.txt"
        @change="handleFileChange"
      />
      <div
        v-if="attachments.length"
        class="ai-chat-composer__attachments-shell"
      >
        <div
          v-if="canScrollAttachmentsLeft"
          class="ai-chat-composer__attachments-control ai-chat-composer__attachments-control--left"
        >
          <button
            class="ai-chat-composer__attachments-arrow"
            type="button"
            aria-label="向左浏览附件"
            @click="scrollAttachments('left')"
          >
            <el-icon><arrow-left /></el-icon>
          </button>
        </div>
        <div
          ref="attachmentsViewport"
          class="ai-chat-composer__attachments"
          @scroll="updateAttachmentScrollState"
        >
          <ai-attachment-cards
            :attachments="attachments"
            removable
            show-status
            :disable-remove="isSending"
            @remove="removeAttachment"
            @retry="retryAttachment"
          />
        </div>
        <div
          v-if="canScrollAttachmentsRight"
          class="ai-chat-composer__attachments-control ai-chat-composer__attachments-control--right"
        >
          <button
            class="ai-chat-composer__attachments-arrow"
            type="button"
            aria-label="向右浏览附件"
            @click="scrollAttachments('right')"
          >
            <el-icon><arrow-right /></el-icon>
          </button>
        </div>
      </div>
      <div class="ai-chat-composer__input-area">
        <el-input
          v-model="input"
          type="textarea"
          :rows="3"
          maxlength="4000"
          placeholder="给 AI 助理发消息..."
          aria-label="聊天内容"
          :disabled="isSending || props.disabled"
          @keydown="handleComposerKeydown"
        />
      </div>
      <div class="ai-chat-composer__footer">
        <div class="ai-chat-composer__tools">
          <el-tooltip
            v-if="props.deepThinkingAvailable"
            content="深度推理，适合复杂问题和多步分析"
            placement="top"
          >
            <el-button
              class="ai-chat-composer__thinking-toggle"
              :type="deepThinking ? 'primary' : 'default'"
              :plain="!deepThinking"
              :icon="MagicStick"
              round
              :disabled="isSending || props.disabled"
              :aria-pressed="deepThinking"
              aria-label="切换深度思考"
              @click="deepThinking = !deepThinking"
            >
              深度思考
            </el-button>
          </el-tooltip>
          <el-tooltip
            v-if="props.webSearchAvailable"
            content="搜索互联网，获取最新公开信息"
            placement="top"
          >
            <el-button
              class="ai-chat-composer__search-toggle"
              :type="webSearch ? 'primary' : 'default'"
              :plain="!webSearch"
              :icon="Search"
              round
              :disabled="isSending || props.disabled"
              :aria-pressed="webSearch"
              aria-label="切换联网搜索"
              @click="webSearch = !webSearch"
            >
              联网搜索
            </el-button>
          </el-tooltip>
          <el-tooltip
            content="支持 JPG、PNG、WebP、GIF、PDF、DOCX、CSV、TXT；单个文件最大 20 MB，最多 6 个"
            placement="top"
          >
            <el-button
              class="ai-chat-composer__attachment-trigger"
              text
              :disabled="isSending || props.disabled || attachments.length >= 6"
              aria-label="添加图片或文档"
              @click.prevent="selectFiles"
            >
              <el-icon><paperclip /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
        <el-button
          v-if="isSending"
          class="ai-chat-composer__action ai-chat-composer__action--stop"
          type="danger"
          :icon="VideoPause"
          aria-label="停止生成"
          @click="emit('stop')"
        />
        <el-button
          v-else
          class="ai-chat-composer__action"
          type="primary"
          native-type="submit"
          :icon="Promotion"
          :disabled="
            props.disabled ||
            attachments.some(attachment => attachment.status === 'uploading') ||
            attachments.some(attachment => attachment.status === 'failed') ||
            (!input.trim() && !attachments.some(attachment => attachment.status === 'uploaded'))
          "
          aria-label="发送消息"
        />
      </div>
    </form>
    <p class="ai-chat-composer__disclaimer">请勿输入密码、身份证号等敏感信息；AI 回答可能有误，请自行判断。</p>
  </div>
</template>

<style scoped lang="scss">
.ai-chat-composer-wrap {
  position: relative;
  padding: 20px 24px 22px;
}

.ai-chat-composer {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 132px;
  padding: 0;
  border: 1px solid rgba(229, 241, 233, 0.62);
  border-radius: 16px;
  background: rgba(7, 30, 34, 0.72);
  overflow: hidden;
  gap: 0;
}

.ai-chat-composer--has-attachments {
  height: 230px;
}

.ai-chat-composer__file-input {
  display: none;
}

.ai-chat-composer__attachments-shell {
  position: relative;
  flex: 0 0 auto;
  min-width: 0;
  margin-top: 10px;
  overflow: hidden;
}

.ai-chat-composer__attachments {
  display: flex;
  height: 66px;
  min-width: 0;
  padding: 0 10px;
  overflow-x: auto;
  overflow-y: hidden;
  align-items: center;
  gap: 8px;
  scroll-behavior: smooth;
  scrollbar-width: none;
}

.ai-chat-composer__attachments::-webkit-scrollbar {
  display: none;
}

.ai-chat-composer__attachment {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  position: relative;
  min-width: 0;
  border: 0;
  border-radius: 12px;
}

.ai-chat-composer__attachments-control {
  position: absolute;
  z-index: 2;
  top: 0;
  bottom: 0;
  display: flex;
  width: 80px;
  box-sizing: border-box;
  align-items: center;
}

.ai-chat-composer__attachments-control--left {
  left: 0;
  justify-content: flex-start;
  padding-left: 10px;
  background: linear-gradient(90deg, rgba(7, 30, 34, 1) 0%, rgba(7, 30, 34, 1) 60%, rgba(7, 30, 34, 0) 100%);
}

.ai-chat-composer__attachments-control--right {
  right: 0;
  justify-content: flex-end;
  padding-right: 10px;
  background: linear-gradient(270deg, rgba(7, 30, 34, 1) 0%, rgba(7, 30, 34, 1) 60%, rgba(7, 30, 34, 0) 100%);
}

.ai-chat-composer__attachments-arrow {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 8px;
  color: #748078;
  background: transparent;
  cursor: pointer;
  transition:
    color 160ms ease,
    background-color 160ms ease;
}

.ai-chat-composer__attachments-arrow:hover,
.ai-chat-composer__attachments-arrow:focus-visible {
  color: #e5c75f;
  background: rgba(229, 199, 95, 0.14);
}

.ai-chat-composer:focus-within {
  border-color: var(--accent);
}

.ai-chat-composer__input-area {
  flex: 1 1 auto;
  min-height: 0;
  padding: 12px 16px 0;
}

.ai-chat-composer__input-area :deep(.el-textarea) {
  height: 100%;
}

.ai-chat-composer__footer {
  display: flex;
  flex: 0 0 auto;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
}

.ai-chat-composer__action {
  width: 42px;
  height: 42px;
  margin: 0;
  border-radius: 50%;
}

.ai-chat-composer__thinking-toggle {
  margin: 0;
}

.ai-chat-composer__tools {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.ai-chat-composer__attachment-trigger {
  width: 36px;
  height: 36px;
  margin: 0 6px 0 auto;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: #b8c9c0;
  background: transparent;
  transition:
    background-color 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.ai-chat-composer__attachment-trigger.el-button.is-text:not(.is-disabled):hover,
.ai-chat-composer__attachment-trigger.el-button.is-text:not(.is-disabled):focus-visible {
  color: var(--accent);
  border-color: transparent;
  background-color: rgba(229, 199, 95, 0.16);
  transform: translateY(-1px);
}

.ai-chat-composer__attachment-trigger.el-button.is-text:not(.is-disabled):active {
  border-color: transparent;
  background-color: rgba(229, 199, 95, 0.26);
}

.ai-chat-composer__search-toggle {
  margin: 0;
  border-color: rgba(129, 205, 187, 0.72);
  color: #b8eadb;
  background: rgba(30, 108, 94, 0.18);
}

.ai-chat-composer__search-toggle.el-button--primary {
  border-color: #79d5bd;
  color: #082b27;
  background: #79d5bd;
}

.ai-chat-composer__thinking-toggle {
  min-width: 96px;
  margin: 0;
  border-color: rgba(157, 196, 255, 0.72);
  color: #b9d3ff;
  background: rgba(35, 70, 126, 0.18);
}

.ai-chat-composer__thinking-toggle:hover,
.ai-chat-composer__thinking-toggle:focus-visible {
  border-color: #9dc4ff;
  color: #d8e7ff;
  background: rgba(48, 93, 165, 0.32);
}

.ai-chat-composer__thinking-toggle.el-button--primary {
  border-color: var(--accent);
  color: var(--night);
  background: var(--accent);
}

.ai-chat-composer__thinking-toggle.el-button--primary:hover,
.ai-chat-composer__thinking-toggle.el-button--primary:focus-visible {
  border-color: var(--accent-deep);
  background: var(--accent-deep);
}

.ai-chat-composer :deep(.ai-chat-composer__action .el-icon) {
  font-size: 19px;
}

.ai-chat-composer :deep(.el-textarea__inner) {
  height: 100% !important;
  min-height: 0 !important;
  padding: 4px 6px;
  resize: none;
  border: 0;
  border-radius: 0;
  color: #f4f7f1;
  background: transparent;
  box-shadow: none;
}

.ai-chat-composer :deep(.el-textarea__inner::placeholder) {
  color: #a8bbb3;
}

.ai-chat-composer :deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

.ai-chat-composer :deep(.el-button--default) {
  border-color: rgba(229, 241, 233, 0.62);
  color: #f4f7f1;
  background: transparent;
}

.ai-chat-composer :deep(.ai-chat-composer__action--stop.el-button--danger) {
  border-color: var(--el-color-danger);
  color: #fff;
  background: var(--el-color-danger);
}

.ai-chat-composer :deep(.ai-chat-composer__action--stop.el-button--danger:hover) {
  border-color: var(--el-color-danger-light-3);
  background: var(--el-color-danger-light-3);
}

.ai-chat-composer :deep(.ai-chat-composer__action--stop.el-button--danger:focus-visible) {
  outline: 2px solid var(--el-color-danger-light-5);
  outline-offset: 2px;
}

.ai-chat-composer__disclaimer {
  margin: 10px 0 0;
  color: #a8bbb3;
  font-size: 12px;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .ai-chat-composer-wrap {
    padding-right: 20px;
    padding-left: 20px;
  }

  .ai-chat-composer {
    height: 120px;
  }
}
</style>
