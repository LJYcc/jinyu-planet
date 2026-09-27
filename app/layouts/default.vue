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
    <nuxt-link
      v-slot="{ navigate }"
      to="/ai-chat"
      custom
    >
      <el-button
        class="ai-assistant"
        type="warning"
        round
        aria-label="打开 AI 助理"
        @click="navigate"
      >
        <span
          class="ai-assistant__icon"
          aria-hidden="true"
          >✦</span
        >
        <span class="ai-assistant__label">AI 助理</span>
        <span class="sr-only">和 AI 聊聊</span>
      </el-button>
    </nuxt-link>
  </div>
</template>

<style scoped lang="scss">
.site-main {
  color: var(--ink);
  background: var(--paper);
}

.ai-assistant {
  position: fixed;
  z-index: 30;
  right: 24px;
  bottom: max(24px, env(safe-area-inset-bottom));
}

.ai-assistant__icon {
  display: grid;
  width: 25px;
  height: 25px;
  place-items: center;
  border-radius: 50%;
  color: var(--accent);
  background: var(--night);
  font-size: 12px;
}

@media (max-width: 820px) {
  .ai-assistant {
    right: 16px;
  }
}
</style>
