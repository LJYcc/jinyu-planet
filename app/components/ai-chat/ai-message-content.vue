<script setup lang="ts">
import AiMarkdownContent from '~/components/ai-chat/ai-markdown-content.vue';
import AiAttachmentCards from '~/components/ai-chat/ai-attachment-cards.vue';
import type { AiAttachment, AiMessageContentPart, ChatRole } from '~/types/ai-chat';

const props = defineProps<{
  role: ChatRole;
  content: string;
  contentParts?: AiMessageContentPart[];
  attachments?: AiAttachment[];
  showTypingCursor?: boolean;
}>();

/** 当前接口仍返回字符串；内容数组接入后由这里统一按类型分发。 */
const displayParts = computed<AiMessageContentPart[]>(() => {
  if (props.role === 'user') {
    return [{ type: 'text', text: props.content }];
  }

  return props.contentParts?.length ? props.contentParts : [{ type: 'markdown', markdown: props.content }];
});

const hasContent = computed(() => {
  return props.content.trim().length > 0;
});
</script>

<template>
  <div class="ai-message-content">
    <div
      v-if="props.attachments?.length"
      class="ai-message-content__attachments"
      :class="{ 'ai-message-content__attachments--with-content': hasContent }"
    >
      <ai-attachment-cards
        :attachments="props.attachments"
        wrap
      />
    </div>
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

.ai-message-content__attachments {
  margin-bottom: 0;
}

.ai-message-content__attachments--with-content {
  margin-bottom: 10px;
}
</style>
