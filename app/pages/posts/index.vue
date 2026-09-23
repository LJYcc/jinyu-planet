<script setup lang="ts">
useSeoMeta({ title: '星球广场 | 金鱼星球', description: '浏览金鱼星球里的公开信号。' });
</script>

<template>
  <section class="placeholder-page shell-container min-h-[60vh] pb-[120px] pt-[170px]">
    <p class="eyebrow">GOLDFISH PLANET / POSTS</p>
    <h1 class="mb-[18px] text-[clamp(42px,8vw,78px)] font-medium">星球广场</h1>
    <p class="mb-8 max-w-[500px] text-[var(--muted)] leading-[1.9]">
      广场阅读和主题筛选正在接入，先从首页的精选信号开始探索。
    </p>
    <NuxtLink to="/" custom v-slot="{ navigate }">
      <ElButton type="primary" size="large" @click="navigate">返回首页 <span aria-hidden="true">↗</span></ElButton>
    </NuxtLink>
  </section>
</template>
