<script setup lang="ts">
import { Search } from '@element-plus/icons-vue';
import logoDark from '~/assets/logo/goldfish-planet-logo-tech.png';
import logoLight from '~/assets/logo/goldfish-planet-logo-light-tech.png';

const route = useRoute();
const isScrolled = ref(false);
const searchKeyword = ref('');
const isSearchOpen = ref(false);
const darkHeroRoutes = ['/', '/posts', '/write', '/about', '/ai-chat'];
const isHeaderOnDarkHero = computed(() => darkHeroRoutes.includes(route.path) || route.path.startsWith('/posts/'));
const isAiChatRoute = computed(() => route.path === '/ai-chat');
const isHeaderLight = computed(() => !isAiChatRoute.value && (isScrolled.value || !isHeaderOnDarkHero.value));
const isHeaderDarkScrolled = computed(() => isAiChatRoute.value && isScrolled.value);
const activeNav = computed(() => (route.path.startsWith('/posts') ? '/posts' : route.path));

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

function openSearch() {
  searchKeyword.value = typeof route.query.q === 'string' ? route.query.q : '';
  isSearchOpen.value = true;
}

function submitSearch() {
  const q = searchKeyword.value.trim();
  isSearchOpen.value = false;
  void navigateTo({ path: '/posts', query: q ? { q } : {} });
}

onMounted(() => {
  updateScrollState();
  window.addEventListener('scroll', updateScrollState, { passive: true });
});

onBeforeUnmount(() => window.removeEventListener('scroll', updateScrollState));
</script>

<template>
  <header
    class="site-header h-[68px] md:h-[78px]"
    :class="{
      'site-header--scrolled': isHeaderLight,
      'site-header--dark-scrolled': isHeaderDarkScrolled
    }"
  >
    <div class="shell-container site-header__inner flex h-full min-h-0 items-center gap-[15px]">
      <nuxt-link
        class="brand-mark inline-flex min-w-0 shrink-0 items-center gap-[11px] md:min-w-[196px]"
        to="/"
        aria-label="金鱼星球首页"
      >
        <span
          class="relative block h-[46px] w-[117px] md:h-[58px] md:w-[148px]"
          aria-hidden="true"
        >
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
      </nuxt-link>

      <div class="ml-auto flex items-center gap-8">
        <el-menu
          id="primary-navigation"
          class="primary-nav hidden border-0 bg-transparent md:flex"
          mode="horizontal"
          :default-active="activeNav"
          :ellipsis="false"
          aria-label="主导航"
          @select="selectMenu"
        >
          <el-menu-item
            v-for="link in links"
            :key="link.to"
            :index="link.to"
            >{{ link.label }}</el-menu-item
          >
        </el-menu>

        <el-popover
          v-model:visible="isSearchOpen"
          placement="bottom-end"
          trigger="click"
          :width="310"
          popper-class="site-search-popover"
        >
          <form
            class="site-search-form"
            role="search"
            @submit.prevent="submitSearch"
          >
            <el-input
              v-model="searchKeyword"
              :prefix-icon="Search"
              placeholder="搜索公开信号"
              clearable
              aria-label="搜索公开信号"
            />
            <el-button
              type="primary"
              native-type="submit"
              >搜索</el-button
            >
          </form>
          <template #reference>
            <el-button
              class="header-search"
              :icon="Search"
              circle
              text
              aria-label="搜索公开信号"
              @click="openSearch"
            />
          </template>
        </el-popover>

        <nuxt-link
          v-slot="{ navigate }"
          to="/write"
          custom
        >
          <el-button
            type="primary"
            size="small"
            class="header-cta arrow-hover"
            @click="navigate"
          >
            投递新信号
            <span
              class="ml-2"
              aria-hidden="true"
              >↗</span
            >
          </el-button>
        </nuxt-link>
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
  border-bottom: 1px solid rgba(236, 244, 238, 0.14);
  transition:
    background-color 0.45s ease,
    border-color 0.45s ease,
    box-shadow 0.45s ease,
    color 0.45s ease;
}

.site-header--scrolled {
  color: var(--ink);
  background-color: rgba(245, 246, 242, 0.96);
  border-bottom-color: rgba(23, 27, 27, 0.08);
  box-shadow: 0 1px 0 rgba(23, 27, 27, 0.09);
  backdrop-filter: blur(10px);
}

.site-header--dark-scrolled {
  color: #f8fbf8;
  background-color: rgba(16, 27, 29, 0.96);
  border-bottom-color: rgba(236, 244, 238, 0.16);
  box-shadow: 0 1px 0 rgba(1, 9, 11, 0.34);
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
  padding: 0 15px;
  font-size: 13px;
  font-weight: 700;
  transition:
    color 0.2s ease,
    background-color 0.2s ease !important;
}

.primary-nav :deep(.el-menu-item.is-active) {
  color: var(--accent);
}

.primary-nav :deep(.el-menu-item.is-active)::after {
  position: absolute;
  right: 16px;
  bottom: 2px;
  left: 16px;
  height: 3px;
  border-radius: 999px;
  background: var(--accent);
  content: '';
}

.primary-nav.el-menu--horizontal > :deep(.el-menu-item),
.primary-nav.el-menu--horizontal > :deep(.el-menu-item:hover),
.primary-nav.el-menu--horizontal > :deep(.el-menu-item:focus),
.primary-nav.el-menu--horizontal > :deep(.el-menu-item.is-active) {
  border-bottom: 0 !important;
  border-bottom-color: transparent !important;
}

.header-search {
  --el-button-hover-bg-color: rgba(229, 199, 95, 0.16);
  --el-button-hover-text-color: var(--accent);
  color: currentColor;
  font-size: 18px;
}

:global(.site-search-popover) {
  border: 1px solid rgba(23, 27, 27, 0.1);
  border-radius: 0;
  background: #fbfcf8;
  box-shadow: 0 18px 46px rgba(16, 27, 29, 0.16);
}

:global(.site-search-form) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

@media (max-width: 820px) {
  .header-cta {
    display: none;
  }

  .site-header__inner {
    gap: 10px;
  }
}
</style>
