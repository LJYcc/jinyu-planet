<script setup lang="ts">
import assistantMascot from '~/assets/images/ai-assistant-planet-mascot.png';

const route = useRoute();
const shouldShow = computed(() => route.path !== '/ai-chat');
</script>

<template>
  <nuxt-link
    v-if="shouldShow"
    v-slot="{ navigate }"
    to="/ai-chat"
    custom
  >
    <el-tooltip
      content="和 AI 聊聊"
      placement="left"
    >
      <button
        class="ai-assistant-fab"
        type="button"
        aria-label="打开 AI 助理，和 AI 聊聊"
        @click="navigate"
      >
        <span class="ai-assistant-fab__label">AI 助理</span>
        <img
          class="ai-assistant-fab__mascot"
          :src="assistantMascot"
          alt=""
          aria-hidden="true"
        />
      </button>
    </el-tooltip>
  </nuxt-link>
</template>

<style scoped lang="scss">
.ai-assistant-fab {
  position: fixed;
  z-index: 30;
  right: 24px;
  bottom: max(24px, env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 118px;
  min-height: 132px;
  padding: 0;
  color: #fff5cf;
  cursor: pointer;
  background: transparent;
  border: 0;
  filter: drop-shadow(0 18px 28px rgba(4, 17, 20, 0.24));
  transition:
    transform 0.2s ease,
    filter 0.2s ease;
}

.ai-assistant-fab:hover,
.ai-assistant-fab:focus-visible {
  transform: translateY(-4px);
  filter: drop-shadow(0 24px 34px rgba(4, 17, 20, 0.28));
}

.ai-assistant-fab:focus-visible {
  outline: 2px solid rgba(224, 181, 73, 0.8);
  outline-offset: 4px;
}

.ai-assistant-fab__label {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 74px;
  min-height: 32px;
  padding: 0 12px;
  margin-bottom: -16px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  background: linear-gradient(135deg, rgba(224, 181, 73, 0.96), rgba(255, 214, 106, 0.9)), var(--accent);
  border: 1px solid rgba(255, 242, 185, 0.76);
  border-radius: 999px;
  box-shadow:
    0 10px 22px rgba(224, 181, 73, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.36);
}

.ai-assistant-fab__mascot {
  display: block;
  width: 112px;
  height: 112px;
  object-fit: contain;
}

@media (max-width: 820px) {
  .ai-assistant-fab {
    right: 16px;
    bottom: max(16px, env(safe-area-inset-bottom));
    width: 96px;
    min-height: 112px;
  }

  .ai-assistant-fab__label {
    min-width: 66px;
    min-height: 28px;
    font-size: 12px;
  }

  .ai-assistant-fab__mascot {
    width: 92px;
    height: 92px;
  }
}
</style>
