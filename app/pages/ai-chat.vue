<script setup lang="ts">
useSeoMeta({ title: 'AI 助理 | 金鱼星球', description: '和 AI 聊聊任何问题。' });
</script>

<template>
  <section class="placeholder-page shell-container min-h-[60vh] pb-[120px] pt-[170px]">
    <p class="eyebrow">GOLDFISH PLANET / AI CHAT</p>
    <h1 class="mb-[18px] text-[clamp(42px,8vw,78px)] font-medium">AI 助理</h1>
    <p class="mb-8 max-w-[500px] text-[var(--muted)] leading-[1.9]">
      AI 对话功能暂未开放，之后会在这里和你聊聊想法。请勿输入密码、身份证号等敏感信息。
    </p>
    <nuxt-link
      v-slot="{ navigate }"
      to="/"
      custom
    >
      <el-button
        type="primary"
        size="large"
        class="arrow-hover"
        @click="navigate"
        >返回首页 <span aria-hidden="true">↗</span></el-button
      >
    </nuxt-link>
  </section>
</template>
