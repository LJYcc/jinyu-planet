<script setup lang="ts">
import {
  ChatDotRound,
  Loading,
  Plus,
  Promotion,
  RefreshRight,
  VideoPause,
  WarningFilled
} from '@element-plus/icons-vue';
import { v4 as uuidv4 } from 'uuid';
import planetIcon from '~/assets/logo/goldfish-planet-icon.png';
import type { ApiSuccess } from '~/types/api';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ChatReply = {
  role: 'assistant';
  content: string;
};

type ApiErrorPayload = {
  code?: string;
  message?: string;
};

const suggestions = ['帮我整理一下今天的想法', '解释一个技术概念', '给我一个周末去处的灵感'];
const STORAGE_KEY = 'goldfish-planet-ai-chat';

// 页面状态先由前端维护，后续可将持久化边界替换为数据库接口。
const messages = ref<ChatMessage[]>([]);
const input = ref('');
const isSending = ref(false);
const requestError = ref('');
const lastFailedMessage = ref('');
let abortController: AbortController | undefined;
let requestSequence = 0;

const hasMessages = computed(() => messages.value.length > 0);
const connectionLabel = computed(() => {
  if (isSending.value) return '正在生成';
  if (requestError.value) return '服务未连接';
  return '等待消息';
});

function createMessage(role: ChatRole, content: string): ChatMessage {
  return { id: uuidv4(), role, content };
}

function persistConversation() {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value));
}

function restoreConversation() {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved) as unknown;
    if (!Array.isArray(parsed)) return;
    messages.value = parsed.filter(
      (message): message is ChatMessage =>
        typeof message === 'object' &&
        message !== null &&
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        typeof message.id === 'string'
    );
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

// 将服务端错误收敛为可直接展示给访客的短消息，避免暴露内部异常细节。
function getApiError(error: unknown) {
  const payload = (error as { data?: ApiErrorPayload }).data;
  if (payload?.code === 'AI_SERVICE_NOT_CONFIGURED') {
    return 'AI 服务尚未配置，因此没有生成回复。请稍后再试。';
  }
  return payload?.message || '请求没有完成，请检查网络后重试。';
}

// 发送和重试共用同一条请求链路，使用序号忽略已经失效的并发响应。
async function requestReply(content: string, isRetry = false) {
  const message = content.trim();
  if (!message || isSending.value) return;

  if (!isRetry) messages.value.push(createMessage('user', message));
  input.value = '';
  requestError.value = '';
  lastFailedMessage.value = message;
  isSending.value = true;
  const currentRequest = ++requestSequence;
  const currentAbortController = new AbortController();
  abortController = currentAbortController;

  try {
    const response = await $fetch<ApiSuccess<ChatReply>>('/api/ai/chat', {
      method: 'POST',
      signal: currentAbortController.signal,
      body: {
        messages: messages.value.map(({ role, content: messageContent }) => ({ role, content: messageContent }))
      }
    });
    if (currentRequest !== requestSequence) return;
    messages.value.push(createMessage('assistant', response.data.content));
    lastFailedMessage.value = '';
  } catch (error) {
    if (currentRequest !== requestSequence) return;
    requestError.value = currentAbortController.signal.aborted ? '已停止本次请求，尚未收到回复。' : getApiError(error);
  } finally {
    if (currentRequest === requestSequence) {
      isSending.value = false;
      abortController = undefined;
    }
  }
}

function sendMessage() {
  void requestReply(input.value);
}

function retryLastMessage() {
  void requestReply(lastFailedMessage.value, true);
}

// 中止请求后由 catch 分支统一更新提示和按钮状态。
function stopGenerating() {
  abortController?.abort();
}

function startNewConversation() {
  requestSequence += 1;
  stopGenerating();
  isSending.value = false;
  messages.value = [];
  input.value = '';
  requestError.value = '';
  lastFailedMessage.value = '';
  sessionStorage.removeItem(STORAGE_KEY);
}

function useSuggestion(suggestion: string) {
  input.value = suggestion;
}

// Enter 发送消息，Shift+Enter 保留多行输入。
function handleComposerKeydown(event: Event) {
  if (!(event instanceof KeyboardEvent)) return;

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

watch(messages, persistConversation, { deep: true });
onMounted(restoreConversation);
onBeforeUnmount(stopGenerating);
</script>

<template>
  <section class="ai-chat-panel">
    <!-- 侧栏仅保留会话操作，消息内容由主区域负责展示。 -->
    <aside class="ai-chat-panel__side">
      <div>
        <p class="eyebrow ai-chat-panel__eyebrow">GOLDFISH PLANET / AI</p>
        <h2 class="m-0 text-[26px] leading-[1.35] text-[#f6f7f0]">AI 对话</h2>
      </div>
      <el-button
        class="w-full"
        :icon="Plus"
        @click="startNewConversation"
      >
        新建对话
      </el-button>
    </aside>

    <div class="ai-chat-panel__main">
      <!-- 顶部状态栏展示连接状态，并提供快速新建会话入口。 -->
      <header class="ai-chat-panel__topbar">
        <div class="flex min-w-0 items-center gap-3">
          <span class="ai-chat-panel__avatar"><chat-dot-round /></span>
          <div>
            <strong class="block text-[15px] text-[#f6f7f0]">AI 助理</strong>
            <span class="ai-chat-panel__status">{{ connectionLabel }}</span>
          </div>
        </div>
        <el-button
          :icon="Plus"
          text
          aria-label="新建对话"
          @click="startNewConversation"
        />
      </header>

      <!-- 消息区域根据当前状态切换欢迎页、消息列表、生成中和错误提示。 -->
      <div class="ai-chat-panel__messages">
        <div
          v-if="!hasMessages"
          class="ai-chat-panel__welcome"
        >
          <img
            :src="planetIcon"
            class="ai-chat-panel__welcome-icon"
            alt=""
          />
          <p class="eyebrow ai-chat-panel__eyebrow">UNIVERSAL AI CHAT</p>
          <h1 class="m-0 text-[38px] font-medium leading-[1.2] text-[#f6f7f0] md:text-[48px]">你好，我是星球小鱼</h1>
          <p class="mb-0 max-w-[620px] leading-[1.9] text-[#c4d0ca]">
            这里可以聊任何问题。服务接入后，消息将由真实 AI 生成；在此之前，页面会如实告诉你连接状态。
          </p>
          <div class="ai-chat-panel__suggestions">
            <el-button
              v-for="suggestion in suggestions"
              :key="suggestion"
              plain
              @click="useSuggestion(suggestion)"
            >
              {{ suggestion }}
            </el-button>
          </div>
        </div>

        <div
          v-else
          class="ai-chat-panel__message-list"
          aria-live="polite"
        >
          <article
            v-for="message in messages"
            :key="message.id"
            class="ai-chat-panel__message"
            :class="`ai-chat-panel__message--${message.role}`"
          >
            <p class="ai-chat-panel__message-label">{{ message.role === 'user' ? '你' : 'AI 助理' }}</p>
            <p>{{ message.content }}</p>
          </article>
        </div>

        <div
          v-if="isSending"
          class="ai-chat-panel__pending"
          role="status"
        >
          <el-icon class="is-loading"><loading /></el-icon>
          AI 助理正在生成回复...
        </div>

        <div
          v-if="requestError"
          class="ai-chat-panel__error"
        >
          <el-alert
            :title="requestError"
            type="error"
            :icon="WarningFilled"
            show-icon
            :closable="false"
          />
          <div class="mt-2">
            <el-button
              v-if="lastFailedMessage"
              :icon="RefreshRight"
              text
              type="primary"
              @click="retryLastMessage"
            >
              重新发送
            </el-button>
          </div>
        </div>
      </div>

      <!-- 输入区固定高度，发送按钮和输入框保持等高。 -->
      <div class="ai-chat-panel__composer-wrap">
        <form
          class="ai-chat-panel__composer"
          @submit.prevent="sendMessage"
        >
          <el-input
            v-model="input"
            type="textarea"
            :rows="3"
            maxlength="4000"
            show-word-limit
            placeholder="给 AI 助理发消息..."
            aria-label="聊天内容"
            :disabled="isSending"
            @keydown="handleComposerKeydown"
          />
          <el-button
            v-if="isSending"
            class="ai-chat-panel__composer-action"
            :icon="VideoPause"
            aria-label="停止生成"
            @click="stopGenerating"
          />
          <el-button
            v-else
            class="ai-chat-panel__composer-action"
            type="primary"
            native-type="submit"
            :icon="Promotion"
            :disabled="!input.trim()"
            aria-label="发送消息"
          />
        </form>
        <p class="ai-chat-panel__disclaimer">请勿输入密码、身份证号等敏感信息；AI 回答可能有误，请自行判断。</p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.ai-chat-panel {
  display: grid;
  min-height: calc(100vh - 128px);
  overflow: hidden;
  border: 1px solid rgba(218, 235, 225, 0.28);
  color: #f6f7f0;
  background: rgba(4, 20, 24, 0.82);
  box-shadow: 0 22px 58px rgba(1, 9, 11, 0.38);
  backdrop-filter: blur(6px);
  grid-template-columns: 250px minmax(0, 1fr);
}

.ai-chat-panel__side {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 30px 24px;
  border-right: 1px solid rgba(218, 235, 225, 0.18);
  background: rgba(5, 22, 25, 0.78);
}

.ai-chat-panel__eyebrow {
  color: #aac1b6;
}

.ai-chat-panel__side :deep(.el-button) {
  min-height: 46px;
  margin: 0;
  border-color: rgba(239, 246, 240, 0.66);
  color: #f5f7f1;
  background: transparent;
}

.ai-chat-panel__side :deep(.el-button:hover),
.ai-chat-panel__side :deep(.el-button:focus-visible) {
  border-color: var(--accent);
  color: var(--night);
  background: var(--accent);
}

.ai-chat-panel__main {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.ai-chat-panel__topbar {
  display: flex;
  min-height: 76px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(218, 235, 225, 0.2);
  background: rgba(4, 20, 24, 0.36);
}

.ai-chat-panel__avatar {
  display: grid;
  width: 35px;
  height: 35px;
  place-items: center;
  color: var(--night);
  background: var(--accent);
  border-radius: 50%;
}

.ai-chat-panel__status {
  display: block;
  margin-top: 3px;
  color: #9db3a9;
  font:
    10px ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.ai-chat-panel__messages {
  min-height: 0;
  overflow-y: auto;
  flex: 1;
  padding: 42px clamp(24px, 5vw, 70px);
}

.ai-chat-panel__welcome > p:not(.eyebrow) {
  margin-top: 18px;
}

.ai-chat-panel__welcome {
  display: flex;
  min-height: 390px;
  align-items: flex-start;
  flex-direction: column;
  justify-content: center;
}

.ai-chat-panel__welcome-icon {
  width: 104px;
  height: 104px;
  margin-bottom: 14px;
  object-fit: contain;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.3));
}

.ai-chat-panel__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 34px;
}

.ai-chat-panel__suggestions :deep(.el-button) {
  height: auto;
  min-height: 38px;
  margin: 0;
  border-color: rgba(230, 242, 234, 0.62);
  color: #eef4ee;
  background: rgba(4, 18, 22, 0.38);
  white-space: normal;
}

.ai-chat-panel__suggestions :deep(.el-button:hover),
.ai-chat-panel__suggestions :deep(.el-button:focus-visible) {
  border-color: var(--accent);
  color: var(--night);
  background: var(--accent);
}

.ai-chat-panel__message-list {
  display: grid;
  gap: 22px;
}

.ai-chat-panel__message {
  max-width: min(88%, 680px);
}

.ai-chat-panel__message-label {
  margin: 0 0 7px;
  color: #b1c2bb;
  font-size: 12px;
  font-weight: 700;
}

.ai-chat-panel__message > p:last-child {
  margin: 0;
  padding: 14px 16px;
  overflow-wrap: anywhere;
  border-radius: 8px;
  line-height: 1.8;
  background: rgba(23, 48, 52, 0.82);
}

.ai-chat-panel__message--user {
  margin-left: auto;
}

.ai-chat-panel__message--user .ai-chat-panel__message-label {
  text-align: right;
}

.ai-chat-panel__message--user > p:last-child {
  color: #f8faf6;
  background: rgba(86, 110, 109, 0.82);
}

.ai-chat-panel__pending {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 24px;
  color: #c2d0c9;
  font-size: 13px;
}

.ai-chat-panel__error {
  margin-top: 24px;
}

.ai-chat-panel__composer-wrap {
  padding: 20px 24px 22px;
  border-top: 1px solid rgba(218, 235, 225, 0.2);
  background: rgba(3, 17, 20, 0.78);
}

.ai-chat-panel__composer {
  --composer-height: 96px;
  display: grid;
  align-items: end;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) var(--composer-height);
}

.ai-chat-panel__composer-action {
  width: var(--composer-height);
  height: var(--composer-height);
  margin: 0;
}

.ai-chat-panel__composer :deep(.el-textarea__inner) {
  min-height: var(--composer-height) !important;
  height: var(--composer-height);
  resize: none;
  border: 1px solid rgba(229, 241, 233, 0.62);
  color: #f4f7f1;
  background: rgba(7, 30, 34, 0.84);
  box-shadow: none;
}

.ai-chat-panel__composer :deep(.el-textarea__inner::placeholder) {
  color: #a8bbb3;
}

.ai-chat-panel__composer :deep(.el-textarea__inner:focus) {
  border-color: var(--accent);
}

.ai-chat-panel__composer :deep(.el-input__count) {
  color: #a8bbb3;
  background: transparent;
}

.ai-chat-panel__composer :deep(.el-button:not(.el-button--primary)) {
  border-color: rgba(229, 241, 233, 0.62);
  color: #f4f7f1;
  background: transparent;
}

.ai-chat-panel__disclaimer {
  margin: 10px 0 0;
  color: #a8bbb3;
  font-size: 12px;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .ai-chat-panel {
    min-height: calc(100vh - 112px);
    grid-template-columns: 1fr;
  }

  .ai-chat-panel__side {
    display: grid;
    align-items: center;
    padding: 20px;
    border-right: 0;
    border-bottom: 1px solid var(--line);
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .ai-chat-panel__side .eyebrow {
    display: none;
  }

  .ai-chat-panel__side :deep(.el-button) {
    width: auto;
  }

  .ai-chat-panel__messages {
    min-height: 430px;
    padding: 30px 20px;
  }

  .ai-chat-panel__topbar,
  .ai-chat-panel__composer-wrap {
    padding-right: 20px;
    padding-left: 20px;
  }

  .ai-chat-panel__composer {
    --composer-height: 82px;
  }

  .ai-chat-panel__disclaimer {
    padding-right: 92px;
  }

  .ai-chat-panel__welcome {
    min-height: 360px;
  }

  .ai-chat-panel__welcome-icon {
    width: 82px;
    height: 82px;
  }
}
</style>
