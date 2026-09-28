<script setup lang="ts">
import AiAssistantFab from '~/components/ai-chat/ai-assistant-fab.vue';
</script>

<template>
  <div class="site-shell">
    <site-header />
    <main
      id="main-content"
      class="site-main min-h-[60vh]"
      tabindex="-1"
    >
      <slot />
    </main>
    <site-footer />
    <ai-assistant-fab />
  </div>
</template>

<style scoped lang="scss">
.site-main {
  color: var(--ink);
  background: var(--paper);
}
</style>
