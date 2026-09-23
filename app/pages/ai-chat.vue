<script setup lang="ts">
useSeoMeta({ title: 'AI 助理 | 金鱼星球', description: '和 AI 聊聊任何问题。' });
</script>

<template>
  <section class="placeholder-page shell-container min-h-[60vh] pb-[120px] pt-[170px]">
    <p class="eyebrow">GOLDFISH PLANET / AI CHAT</p>
    <h1 class="mb-[18px] text-[clamp(42px,8vw,78px)] font-medium">AI 助理</h1>
    <p class="mb-8 max-w-[500px] text-[var(--muted)] leading-[1.9]">
      通用 AI 对话空间将在后续任务接入。请勿在对话中输入密码、身份证号等敏感信息。
    </p>
    <NuxtLink to="/" custom v-slot="{ navigate }">
      <ElButton type="primary" size="large" @click="navigate">返回首页 <span aria-hidden="true">↗</span></ElButton>
    </NuxtLink>
  </section>
</template>
