<script setup lang="ts">
import { MagicStick, Promotion, VideoPause } from '@element-plus/icons-vue';

// 输入框内部只处理输入体验（Enter 发送、Shift+Enter 换行、停止按钮）。
// 实际发送请求仍由父组件执行，因此这里不会重复实现 AI 请求逻辑。
const props = defineProps<{
  isSending: boolean;
  disabled?: boolean;
  deepThinkingAvailable?: boolean;
}>();

const input = defineModel<string>({ required: true });
const deepThinking = defineModel<boolean>('deepThinking', { default: false });

const emit = defineEmits<{
  send: [];
  stop: [];
}>();

function sendMessage() {
  if (!props.disabled && input.value.trim()) emit('send');
}

function handleComposerKeydown(event: Event) {
  if (!(event instanceof KeyboardEvent)) return;
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}
</script>

<template>
  <div class="ai-chat-composer-wrap">
    <form
      class="ai-chat-composer"
      @submit.prevent="sendMessage"
    >
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
      <el-button
        v-if="props.deepThinkingAvailable"
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
        :disabled="props.disabled || !input.trim()"
        aria-label="发送消息"
      />
    </form>
    <p class="ai-chat-composer__disclaimer">请勿输入密码、身份证号等敏感信息；AI 回答可能有误，请自行判断。</p>
  </div>
</template>

<style scoped lang="scss">
.ai-chat-composer-wrap {
  padding: 20px 24px 22px;
}

.ai-chat-composer {
  display: grid;
  height: 132px;
  padding: 8px 10px;
  border: 1px solid rgba(229, 241, 233, 0.62);
  border-radius: 16px;
  background: rgba(7, 30, 34, 0.72);
  gap: 0;
  grid-template-rows: minmax(0, 1fr) 42px;
  grid-template-columns: minmax(0, 1fr) 42px;
}

.ai-chat-composer:focus-within {
  border-color: var(--accent);
}

.ai-chat-composer :deep(.el-textarea) {
  grid-row: 1;
  grid-column: 1 / -1;
  height: 100%;
}

.ai-chat-composer__action {
  grid-row: 2;
  grid-column: 2;
  align-self: end;
  justify-self: end;
  width: 42px;
  height: 42px;
  margin: 0;
  border-radius: 50%;
}

.ai-chat-composer__thinking-toggle {
  grid-row: 2;
  grid-column: 1;
  align-self: center;
  justify-self: start;
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
