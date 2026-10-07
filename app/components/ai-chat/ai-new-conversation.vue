<script setup lang="ts">
/**
 * 新对话的居中欢迎界面。
 *
 * 它只在尚未创建数据库会话时展示，并复用现有输入组件；发送、停止和重试
 * 仍通过事件交给页面控制器，避免在展示组件中重复实现 AI 请求逻辑。
 */
import { Compass, Connection, MagicStick, RefreshRight, WarningFilled } from '@element-plus/icons-vue';
import planetIcon from '~/assets/logo/goldfish-planet-icon-start.png';
import AiChatComposer from '~/components/ai-chat/ai-chat-composer.vue';

const props = defineProps<{
  isSending: boolean;
  disabled?: boolean;
  requestError: string;
  canRetry: boolean;
  deepThinkingAvailable?: boolean;
  webSearchAvailable?: boolean;
}>();

const modelValue = defineModel<string>({ required: true });
const deepThinking = defineModel<boolean>('deepThinking', { default: false });
const webSearch = defineModel<boolean>('webSearch', { default: false });

const emit = defineEmits<{
  send: [];
  stop: [];
  retry: [];
  useSuggestion: [suggestion: string];
}>();

const suggestions = [
  { text: '帮我整理一下今天的想法', icon: MagicStick },
  { text: '解释一个技术概念', icon: Connection },
  { text: '给我一个周末去处的灵感', icon: Compass }
];
</script>

<template>
  <section class="ai-new-conversation">
    <div class="ai-new-conversation__content">
      <img
        :src="planetIcon"
        class="ai-new-conversation__icon"
        alt=""
      />
      <h1
        class="ai-new-conversation__title m-0 text-center text-[38px] font-medium leading-[1.2] text-[#f6f7f0] md:text-[48px]"
      >
        你好，我是星球小鱼
      </h1>
      <p class="ai-new-conversation__subtitle m-0 text-center leading-[1.9] text-[#c4d0ca]">今天想聊点什么？</p>

      <div class="ai-new-conversation__composer">
        <ai-chat-composer
          v-model="modelValue"
          :is-sending="props.isSending"
          :disabled="props.disabled"
          :deep-thinking-available="props.deepThinkingAvailable"
          v-model:deep-thinking="deepThinking"
          :web-search-available="props.webSearchAvailable"
          v-model:web-search="webSearch"
          @send="emit('send')"
          @stop="emit('stop')"
        />
      </div>

      <div class="ai-new-conversation__suggestions">
        <el-button
          v-for="suggestion in suggestions"
          :key="suggestion.text"
          :icon="suggestion.icon"
          plain
          :disabled="props.disabled"
          @click="emit('useSuggestion', suggestion.text)"
        >
          {{ suggestion.text }}
        </el-button>
      </div>

      <div
        v-if="props.requestError"
        class="ai-new-conversation__error"
      >
        <el-alert
          :title="props.requestError"
          type="error"
          :icon="WarningFilled"
          show-icon
          :closable="false"
        />
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
  </section>
</template>

<style scoped lang="scss">
.ai-new-conversation {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 28px clamp(20px, 5vw, 72px);
  scrollbar-color: rgba(224, 181, 73, 0.58) transparent;
  scrollbar-width: thin;
}

.ai-new-conversation__content {
  display: flex;
  width: min(100%, 720px);
  flex-direction: column;
  align-items: center;
  transform: translateY(-42px);
}

.ai-new-conversation__icon {
  width: 150px;
  height: 150px;
  margin-bottom: 10px;
  object-fit: contain;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.3));
}

.ai-new-conversation__subtitle {
  margin-top: 14px;
}

.ai-new-conversation__title {
  animation: ai-new-conversation-title-glow 2.8s ease-in-out infinite;
  text-shadow:
    0 0 10px rgba(255, 239, 188, 0.4),
    0 0 26px rgba(224, 181, 73, 0.22);
}

@keyframes ai-new-conversation-title-glow {
  50% {
    text-shadow:
      0 0 14px rgba(255, 239, 188, 0.56),
      0 0 34px rgba(224, 181, 73, 0.34);
  }
}

.ai-new-conversation__composer {
  width: 100%;
  margin-top: 28px;
}

.ai-new-conversation__composer :deep(.ai-chat-composer-wrap) {
  padding: 0;
}

.ai-new-conversation__suggestions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 26px;
}

.ai-new-conversation__suggestions :deep(.el-button) {
  display: inline-flex;
  height: auto;
  min-height: 38px;
  margin: 0;
  align-items: center;
  border-color: rgba(230, 242, 234, 0.62);
  border-radius: 100px;
  color: #eef4ee;
  background: rgba(4, 18, 22, 0.38);
  white-space: normal;
}

.ai-new-conversation__suggestions :deep(.el-button .el-icon) {
  display: inline-flex;
  width: 17px;
  height: 17px;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  font-size: 17px;
  line-height: 1;
  vertical-align: middle;
}

.ai-new-conversation__suggestions :deep(.el-button:hover),
.ai-new-conversation__suggestions :deep(.el-button:focus-visible) {
  border-color: var(--accent);
  color: var(--night);
  background: var(--accent);
}

.ai-new-conversation__suggestions :deep(.el-button:hover .el-icon),
.ai-new-conversation__suggestions :deep(.el-button:focus-visible .el-icon) {
  color: var(--night);
}

.ai-new-conversation__error {
  display: grid;
  width: 100%;
  margin-top: 20px;
  gap: 8px;
}

.ai-new-conversation__error :deep(.el-button) {
  justify-self: start;
  margin: 0;
}

@media (max-width: 900px) {
  .ai-new-conversation {
    min-height: 430px;
  }

  .ai-new-conversation__content {
    transform: translateY(-20px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ai-new-conversation__title {
    animation: none;
  }
}
</style>
