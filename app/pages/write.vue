<script setup lang="ts">
useSeoMeta({ title: '投递新信号 | 金鱼星球', description: '写下想被读到的一点真心。' });
</script>

<template>
  <section class="placeholder-page shell-container min-h-[60vh] pb-[120px] pt-[170px]">
    <p class="eyebrow">GOLDFISH PLANET / WRITE</p>
    <h1 class="mb-[18px] text-[clamp(42px,8vw,78px)] font-medium">投递新信号</h1>
    <p class="mb-8 max-w-[500px] text-[var(--muted)] leading-[1.9]">
      匿名写作编辑器将在下一阶段开放。你可以先看看星球里已经抵达的信号。
    </p>
    <NuxtLink to="/posts" custom v-slot="{ navigate }">
      <ElButton type="primary" size="large" @click="navigate">浏览星球广场 <span aria-hidden="true">↗</span></ElButton>
    </NuxtLink>
  </section>
</template>
