<script setup lang="ts">
import { Promotion, VideoPause } from '@element-plus/icons-vue';

// 输入框内部只处理输入体验（Enter 发送、Shift+Enter 换行、停止按钮）。
// 实际发送请求仍由父组件执行，因此这里不会重复实现 AI 请求逻辑。
const props = defineProps<{
  modelValue: string;
  isSending: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  send: [];
  stop: [];
}>();

const input = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
});

function sendMessage() {
  if (input.value.trim()) emit('send');
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
        :disabled="isSending"
        @keydown="handleComposerKeydown"
      />
      <el-button
        v-if="isSending"
        class="ai-chat-composer__action"
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
        :disabled="!input.trim()"
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

.ai-chat-composer :deep(.el-button:not(.el-button--primary)) {
  border-color: rgba(229, 241, 233, 0.62);
  color: #f4f7f1;
  background: transparent;
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
