<script setup lang="ts">
useSeoMeta({ title: '关于星球 | 金鱼星球', description: '认识金鱼星球，以及为什么这里允许路过。' });
</script>

<template>
  <section class="placeholder-page shell-container min-h-[60vh] pb-[120px] pt-[170px]">
    <p class="eyebrow">GOLDFISH PLANET / ABOUT</p>
    <h1 class="mb-[18px] text-[clamp(42px,8vw,78px)] font-medium">关于这颗星球</h1>
    <p class="mb-8 max-w-[500px] text-[var(--muted)] leading-[1.9]">
      金鱼星球是一处开放、轻盈的中文空间，收集生活片段、脑内宇宙和愿意被陌生人读到的小小发现。
    </p>
    <NuxtLink to="/write" custom v-slot="{ navigate }">
      <ElButton type="primary" size="large" @click="navigate">投递一条信号 <span aria-hidden="true">↗</span></ElButton>
    </NuxtLink>
  </section>
</template>
