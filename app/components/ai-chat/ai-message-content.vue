<script setup lang="ts">
import AiMarkdownContent from '~/components/ai-chat/ai-markdown-content.vue';
import type { AiMessageContentPart, ChatRole } from '~/types/ai-chat';

const props = defineProps<{
  role: ChatRole;
  content: string;
  contentParts?: AiMessageContentPart[];
  showTypingCursor?: boolean;
}>();

/** 当前接口仍返回字符串；内容数组接入后由这里统一按类型分发。 */
const displayParts = computed<AiMessageContentPart[]>(() => {
  if (props.role === 'user') {
    return [{ type: 'text', text: props.content }];
  }

  return props.contentParts?.length ? props.contentParts : [{ type: 'markdown', markdown: props.content }];
});
</script>

<template>
  <div class="ai-message-content">
    <template
      v-for="(part, index) in displayParts"
      :key="index"
    >
      <ai-markdown-content
        v-if="part.type === 'markdown'"
        :content="part.markdown"
        :show-typing-cursor="props.showTypingCursor && index === displayParts.length - 1"
      />
      <p
        v-else
        class="ai-message-content__text"
      >
        {{ part.text }}
      </p>
    </template>
  </div>
</template>

<style scoped lang="scss">
.ai-message-content__text {
  margin: 0;
}
</style>
