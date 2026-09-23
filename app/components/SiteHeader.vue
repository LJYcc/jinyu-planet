<script setup lang="ts">
import logoDark from '~/assets/logo/goldfish-planet-logo.png';
import logoLight from '~/assets/logo/goldfish-planet-logo-light.png';

const route = useRoute();
const isScrolled = ref(false);
const isHeaderLight = computed(() => isScrolled.value || route.path !== '/');

const links = [
  { label: '首页', to: '/' },
  { label: '星球广场', to: '/posts' },
  { label: '投递新信号', to: '/write' },
  { label: '关于星球', to: '/about' }
];

function updateScrollState() {
  isScrolled.value = window.scrollY > 28;
}

function selectMenu(path: string) {
  void navigateTo(path);
}

onMounted(() => {
  updateScrollState();
  window.addEventListener('scroll', updateScrollState, { passive: true });
});

onBeforeUnmount(() => window.removeEventListener('scroll', updateScrollState));
</script>

<template>
  <header class="site-header h-[68px] md:h-[76px]" :class="{ 'site-header--scrolled': isHeaderLight }">
    <div class="shell-container site-header__inner flex h-full min-h-0 items-center gap-[15px]">
      <NuxtLink
        class="brand-mark inline-flex min-w-0 shrink-0 items-center gap-[11px] md:min-w-[196px]"
        to="/"
        aria-label="金鱼星球首页"
      >
        <span class="relative block h-[46px] w-[117px] md:h-[58px] md:w-[148px]" aria-hidden="true">
          <img
            :src="logoLight"
            class="absolute inset-0 h-full w-full object-contain object-left transition-opacity duration-500"
            :class="isHeaderLight ? 'opacity-0' : 'opacity-100'"
            alt=""
          />
          <img
            :src="logoDark"
            class="absolute inset-0 h-full w-full object-contain object-left transition-opacity duration-500"
            :class="isHeaderLight ? 'opacity-100' : 'opacity-0'"
            alt=""
          />
        </span>
      </NuxtLink>

      <div class="ml-auto flex items-center gap-8">
        <ElMenu
          id="primary-navigation"
          class="primary-nav hidden border-0 bg-transparent md:flex"
          mode="horizontal"
          :default-active="route.path"
          :ellipsis="false"
          aria-label="主导航"
          @select="selectMenu"
        >
          <ElMenuItem v-for="link in links" :key="link.to" :index="link.to">{{ link.label }}</ElMenuItem>
        </ElMenu>

        <NuxtLink to="/write" custom v-slot="{ navigate }">
          <ElButton type="primary" size="small" class="header-cta" @click="navigate">
            投递信号 <span class="ml-2" aria-hidden="true">↗</span>
          </ElButton>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.site-header {
  position: fixed;
  z-index: 20;
  top: 0;
  right: 0;
  left: 0;
  color: #f8fbf8;
  background-color: transparent;
  transition:
    background-color 0.45s ease,
    box-shadow 0.45s ease,
    color 0.45s ease;
}

.site-header--scrolled {
  color: var(--ink);
  background-color: rgba(245, 246, 242, 0.96);
  box-shadow: 0 1px 0 rgba(23, 27, 27, 0.09);
  backdrop-filter: blur(10px);
}

.primary-nav {
  --el-menu-active-color: var(--accent);
  --el-menu-bg-color: transparent;
  --el-menu-hover-bg-color: transparent;
  --el-menu-hover-text-color: var(--accent);
  --el-menu-text-color: currentColor;
  --el-menu-horizontal-height: 44px;
  border-bottom: 0 !important;
}

.primary-nav :deep(.el-menu-item) {
  border-bottom: 0;
  padding: 0 14px;
  font-size: 13px;
  transition:
    color 0.2s ease,
    background-color 0.2s ease !important;
}

.primary-nav.el-menu--horizontal > :deep(.el-menu-item),
.primary-nav.el-menu--horizontal > :deep(.el-menu-item:hover),
.primary-nav.el-menu--horizontal > :deep(.el-menu-item:focus),
.primary-nav.el-menu--horizontal > :deep(.el-menu-item.is-active) {
  border-bottom: 0 !important;
  border-bottom-color: transparent !important;
}

@media (max-width: 820px) {
  .header-cta {
    display: none;
  }
}
</style>
