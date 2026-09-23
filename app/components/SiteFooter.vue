<script setup lang="ts">
import logoLight from '~/assets/logo/goldfish-planet-logo-light.png';
</script>

<template>
  <footer class="site-footer bg-[#0c1517] px-0 pb-7 pt-[75px] text-[#e4eee6]">
    <div class="shell-container site-footer__grid grid gap-10 pb-[68px] max-md:pb-11 md:grid-cols-[1fr_auto]">
      <div>
        <img :src="logoLight" class="mb-6 h-[52px] w-auto object-contain object-left" alt="金鱼星球" />
        <p class="eyebrow">GOLDFISH PLANET</p>
        <h2 class="m-0 max-w-[450px] text-[clamp(24px,4vw,38px)] font-medium leading-[1.4]">
          把想说的话，投进一颗小小的星球。
        </h2>
      </div>
      <div class="site-footer__links flex flex-col items-start gap-[14px] text-[13px] text-[#afc0b8]">
        <NuxtLink to="/posts">浏览星球广场</NuxtLink>
        <NuxtLink to="/write">投递新信号</NuxtLink>
        <NuxtLink to="/about">关于这颗星球</NuxtLink>
      </div>
    </div>
    <div
      class="shell-container site-footer__meta flex gap-5 pt-[18px] max-md:flex-col max-md:items-start md:justify-between"
    >
      <span>© {{ new Date().getFullYear() }} Goldfish Planet</span>
      <span>一个允许路过，也允许留下的地方。</span>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.site-footer__links a:hover {
  color: var(--accent);
}

.site-footer__meta {
  border-top: 1px solid rgba(216, 233, 221, 0.2);
  color: #80938a;
  font:
    10px ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}
</style>
