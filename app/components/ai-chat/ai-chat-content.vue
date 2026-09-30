<script setup lang="ts">
import { Loading, RefreshRight, WarningFilled } from '@element-plus/icons-vue';
import planetIcon from '~/assets/logo/goldfish-planet-icon-tech.png';
import AiMessageContent from '~/components/ai-chat/ai-message-content.vue';
import type { ChatMessage } from '~/types/ai-chat';

// 消息区负责展示标题、消息和错误状态；发送、保存标题等业务操作由父组件处理。
const props = defineProps<{
  conversationTitle: string;
  messages: ChatMessage[];
  isLoadingConversations: boolean;
  isLoadingContent: boolean;
  loadingConversationTitle?: string;
  isSending: boolean;
  requestError: string;
  canRetry: boolean;
  typingMessageId?: string;
}>();

const emit = defineEmits<{
  rename: [title: string];
  retry: [];
}>();

const isEditingTitle = ref(false);
const titleDraft = ref('');
const messagesElement = ref<HTMLElement>();
const messageListElement = ref<HTMLElement>();
let scrollFrame: number | undefined;
let messageListObserver: ResizeObserver | undefined;

/** 合并连续的流式更新，在 DOM 更新完成后的下一帧将消息区域定位到底部。 */
function scrollToBottom() {
  if (import.meta.server || scrollFrame) {
    return;
  }

  scrollFrame = window.requestAnimationFrame(() => {
    if (messagesElement.value) {
      messagesElement.value.scrollTop = messagesElement.value.scrollHeight;
    }

    scrollFrame = undefined;
  });
}

function startTitleEdit() {
  titleDraft.value = props.conversationTitle;
  isEditingTitle.value = true;
}

function cancelTitleEdit() {
  isEditingTitle.value = false;
  titleDraft.value = '';
}

function saveTitle() {
  if (!isEditingTitle.value) {
    return;
  }

  const nextTitle = titleDraft.value.trim();
  if (!nextTitle) {
    cancelTitleEdit();
    return;
  }

  emit('rename', nextTitle);
  isEditingTitle.value = false;
}

watch(() => props.messages, scrollToBottom, { deep: true, flush: 'post' });

watch(() => [props.isSending, props.requestError], scrollToBottom, { flush: 'post' });

onMounted(() => {
  scrollToBottom();
  if (messageListElement.value) {
    // Markdown、图片和图表完成异步渲染后高度可能继续变化，监听列表尺寸可保持底部可见。
    messageListObserver = new ResizeObserver(scrollToBottom);
    messageListObserver.observe(messageListElement.value);
  }
});

onBeforeUnmount(() => {
  if (scrollFrame) {
    window.cancelAnimationFrame(scrollFrame);
  }

  messageListObserver?.disconnect();
});

defineExpose({ scrollToBottom });
</script>

<template>
  <header class="ai-chat-content__topbar">
    <el-skeleton
      v-if="props.isLoadingConversations"
      class="ai-chat-content__title-skeleton"
      style="--el-skeleton-color: rgba(203, 223, 211, 0.12); --el-skeleton-to-color: rgba(203, 223, 211, 0.2)"
      animated
    >
      <template #template>
        <el-skeleton-item variant="text" />
      </template>
    </el-skeleton>
    <el-input
      v-else-if="isEditingTitle"
      v-model="titleDraft"
      class="ai-chat-content__title-input"
      maxlength="160"
      autofocus
      @keyup.enter="saveTitle"
      @keyup.esc="cancelTitleEdit"
      @blur="saveTitle"
    />
    <button
      v-else
      class="ai-chat-content__title"
      type="button"
      aria-label="编辑会话标题"
      :disabled="props.isLoadingContent"
      @click="startTitleEdit"
    >
      {{ props.loadingConversationTitle || props.conversationTitle }}
    </button>
  </header>

  <div
    ref="messagesElement"
    class="ai-chat-content__messages"
    :class="{ 'ai-chat-content__messages--loading': props.isLoadingContent }"
    :aria-busy="props.isLoadingContent"
  >
    <div
      v-show="!props.isLoadingContent"
      ref="messageListElement"
      class="ai-chat-content__message-list"
      aria-live="polite"
    >
      <article
        v-for="message in props.messages"
        :key="message.id"
        class="ai-chat-content__message"
        :class="`ai-chat-content__message--${message.role}`"
      >
        <img
          v-if="message.role === 'assistant'"
          :src="planetIcon"
          class="ai-chat-content__message-avatar"
          alt="小鱼 AI 助理头像"
        />
        <span
          v-else
          class="ai-chat-content__message-avatar ai-chat-content__message-avatar--user"
          aria-hidden="true"
        >
          你
        </span>
        <div class="ai-chat-content__message-body">
          <p class="ai-chat-content__message-label">
            {{ message.role === 'user' ? '你' : '小鱼 AI 助理' }}
          </p>
          <span
            v-if="message.id === props.typingMessageId && !message.content"
            class="ai-chat-content__typing-cursor ai-chat-content__typing-cursor--waiting"
            aria-label="AI 正在输入"
          />
          <ai-message-content
            v-if="message.role === 'user' || message.content"
            class="ai-chat-content__message-bubble"
            :class="{ 'ai-chat-content__message-bubble--user': message.role === 'user' }"
            :role="message.role"
            :content="message.content"
            :content-parts="message.contentParts"
            :show-typing-cursor="message.id === props.typingMessageId && Boolean(message.content)"
          />
        </div>
      </article>
    </div>

    <div
      v-if="props.isLoadingContent"
      class="ai-chat-content__content-loading"
      role="status"
      aria-label="正在加载会话消息"
    >
      <el-icon class="is-loading"><loading /></el-icon>
    </div>

    <div
      v-if="!props.isLoadingContent && props.isSending"
      class="ai-chat-content__pending"
      role="status"
    >
      <el-icon class="is-loading"><loading /></el-icon>
      AI 助理正在生成回复...
    </div>

    <div
      v-if="!props.isLoadingContent && props.requestError"
      class="ai-chat-content__error"
    >
      <el-alert
        :title="props.requestError"
        type="error"
        :icon="WarningFilled"
        show-icon
        :closable="false"
      />
      <div class="mt-2">
        <el-button
          v-if="props.canRetry"
          :icon="RefreshRight"
          text
          type="primary"
          @click="emit('retry')"
        >
          重新发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ai-chat-content__topbar {
  display: flex;
  height: 48px;
  flex: 0 0 48px;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid rgba(218, 235, 225, 0.2);
}

.ai-chat-content__title {
  max-width: min(70%, 640px);
  overflow: hidden;
  padding: 5px 8px;
  color: #f6f7f0;
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: text;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
}

.ai-chat-content__title:hover,
.ai-chat-content__title:focus-visible {
  border-color: rgba(224, 181, 73, 0.4);
  outline: none;
}

.ai-chat-content__title-input {
  max-width: min(70%, 640px);
}

.ai-chat-content__title-skeleton {
  width: 148px;
}

.ai-chat-content__title-skeleton :deep(.el-skeleton__item) {
  margin: 0;
}

.ai-chat-content__title-input :deep(.el-input__wrapper) {
  background: transparent;
  box-shadow: none;
}

.ai-chat-content__title-input :deep(.el-input__inner) {
  color: #f6f7f0;
}

.ai-chat-content__title-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(224, 181, 73, 0.42) inset;
}

.ai-chat-content__messages {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 20px clamp(12px, 1.5vw, 20px);
  scrollbar-color: rgba(224, 181, 73, 0.58) transparent;
  scrollbar-width: thin;
}

.ai-chat-content__messages::-webkit-scrollbar {
  width: 6px;
}

.ai-chat-content__messages::-webkit-scrollbar-track {
  background: transparent;
}

.ai-chat-content__messages::-webkit-scrollbar-thumb {
  border: 1px solid transparent;
  border-radius: 999px;
  background: rgba(224, 181, 73, 0.42);
  background-clip: padding-box;
}

.ai-chat-content__messages::-webkit-scrollbar-thumb:hover {
  background: rgba(224, 181, 73, 0.7);
  background-clip: padding-box;
}

.ai-chat-content__message-list {
  display: grid;
  gap: 22px;
}

.ai-chat-content__messages--loading {
  display: grid;
  overflow: hidden;
  padding: 0;
}

.ai-chat-content__messages--loading .ai-chat-content__message-list {
  min-height: 0;
}

.ai-chat-content__content-loading {
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
  place-items: center;
  color: var(--accent);
  font-size: 32px;
  background: rgba(0, 0, 0, 0.1);
}

.ai-chat-content__message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: min(88%, 680px);
}

.ai-chat-content__message--assistant {
  width: min(94%, 880px);
  max-width: min(94%, 880px);
}

.ai-chat-content__message--assistant .ai-chat-content__message-body {
  flex: 1 1 auto;
  width: 0;
}

.ai-chat-content__message-body {
  min-width: 0;
}

.ai-chat-content__message-avatar {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  object-fit: contain;
  border-radius: 50%;
}

.ai-chat-content__message-avatar--user {
  display: grid;
  place-items: center;
  color: #f7faf4;
  font-size: 12px;
  font-weight: 700;
  background: rgba(86, 110, 109, 0.9);
  border: 1px solid rgba(229, 241, 233, 0.34);
}

.ai-chat-content__message-label {
  margin: 0 0 7px;
  color: #b1c2bb;
  font-size: 12px;
  font-weight: 700;
}

.ai-chat-content__message-bubble {
  margin: 0;
  padding: 14px 16px;
  overflow-wrap: anywhere;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.8;
  background: rgba(23, 48, 52, 0.82);
}

.ai-chat-content__message--assistant .ai-chat-content__message-bubble {
  padding: 0;
  background: transparent;
}

.ai-chat-content__typing-cursor {
  display: inline-block;
  width: 0.52em;
  height: 1.1em;
  margin-left: 3px;
  vertical-align: -0.16em;
  background: var(--accent);
  animation: ai-chat-cursor-blink 0.8s step-end infinite;
}

.ai-chat-content__typing-cursor--waiting {
  display: block;
  margin: 0 0 8px;
}

@keyframes ai-chat-cursor-blink {
  50% {
    opacity: 0;
  }
}

.ai-chat-content__message--user {
  margin-left: auto;
  flex-direction: row-reverse;
}

.ai-chat-content__message--user .ai-chat-content__message-label {
  text-align: right;
}

.ai-chat-content__message--user .ai-chat-content__message-bubble {
  color: #f8faf6;
  background: rgba(86, 110, 109, 0.82);
}

.ai-chat-content__pending {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 24px;
  color: #c2d0c9;
  font-size: 13px;
}

.ai-chat-content__error {
  margin-top: 24px;
}

@media (max-width: 900px) {
  .ai-chat-content__messages {
    min-height: 430px;
    padding: 20px 16px;
  }

  .ai-chat-content__topbar {
    padding-right: 20px;
    padding-left: 20px;
  }
}
</style>
