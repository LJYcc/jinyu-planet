<script setup lang="ts">
import chatBackground from '~/assets/images/bg-ai-chat-star-valley-hero-v8.png';
import AiChatPanel from '~/components/ai-chat/ai-chat-panel.vue';

useSeoMeta({ title: 'AI 助理 | 金鱼星球', description: '和 AI 聊聊任何问题。' });
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
  min-height: 100vh;
  padding: 96px 0 32px;
  background-color: var(--night);
  background-position: center;
  background-size: cover;
}

.ai-chat-page__inner {
  min-height: calc(100vh - 128px);
}

@media (max-width: 760px) {
  .ai-chat-page {
    padding: 84px 0 28px;
  }

  .ai-chat-page__inner {
    min-height: calc(100vh - 112px);
  }
}
</style>
