<script setup lang="ts">
import chatBackground from '~/assets/images/bg-ai-chat-star-valley-hero-v8.png';
import AiChatPanel from '~/components/ai-chat/ai-chat-panel.vue';

definePageMeta({ layout: false });

useSeoMeta({ title: 'AI 助理 | 金鱼星球', description: '和 AI 聊聊任何问题。' });
useHead({ bodyAttrs: { class: 'ai-chat-page-body' } });
</script>

<template>
  <section
    class="ai-chat-page"
    :style="{
      backgroundImage: `linear-gradient(180deg, rgba(4, 17, 20, 0.4), rgba(4, 17, 20, 0.74)), url(${chatBackground})`
    }"
  >
    <div class="shell-container ai-chat-page__inner">
      <ai-chat-panel />
    </div>
  </section>
</template>

<style scoped lang="scss">
.ai-chat-page {
  box-sizing: border-box;
  height: 100vh;
  height: 100dvh;
  padding: 16px;
  overflow: hidden;
  background-color: var(--night);
  background-position: center;
  background-size: cover;
}

:global(body.ai-chat-page-body) {
  overflow: hidden;
}

.ai-chat-page__inner {
  --container: 1280px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 760px) {
  .ai-chat-page {
    padding: 10px;
  }
}
</style>
