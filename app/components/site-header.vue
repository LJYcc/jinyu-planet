<script setup lang="ts">
import { Search } from '@element-plus/icons-vue';
import logoDark from '~/assets/logo/goldfish-planet-logo-tech.png';
import logoLight from '~/assets/logo/goldfish-planet-logo-light-tech.png';
import PostList from '~/components/posts/post-list.vue';
import { listPosts } from '~/services/post-api';
import type { PostListItem } from '~/types/post';

const route = useRoute();
const isScrolled = ref(false);
const searchKeyword = ref('');
const isSearchOpen = ref(false);
const searchPosts = ref<PostListItem[]>([]);
const isSearchLoading = ref(false);
const searchError = ref('');
let searchTimer: ReturnType<typeof setTimeout> | undefined;
let searchRequestId = 0;
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
  isSearchOpen.value = true;
}

function resetSearch() {
  searchRequestId += 1;
  if (searchTimer) clearTimeout(searchTimer);
  searchKeyword.value = '';
  searchPosts.value = [];
  searchError.value = '';
  isSearchLoading.value = false;
}

async function loadSearchResults(keyword: string) {
  const requestId = ++searchRequestId;
  const q = keyword.trim();
  if (!q) {
    searchPosts.value = [];
    searchError.value = '';
    isSearchLoading.value = false;
    return;
  }

  isSearchLoading.value = true;
  searchError.value = '';
  try {
    const page = await listPosts({ q, page: 1, pageSize: 100, sort: 'latest' });
    if (requestId === searchRequestId) searchPosts.value = page.items;
  } catch {
    if (requestId === searchRequestId) searchError.value = '搜索暂时不可用，请稍后重试。';
  } finally {
    if (requestId === searchRequestId) isSearchLoading.value = false;
  }
}

watch(searchKeyword, keyword => {
  if (!isSearchOpen.value) return;
  if (searchTimer) clearTimeout(searchTimer);
  if (!keyword.trim()) {
    void loadSearchResults('');
    return;
  }
  searchTimer = setTimeout(() => void loadSearchResults(keyword), 300);
});

onMounted(() => {
  updateScrollState();
  window.addEventListener('scroll', updateScrollState, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrollState);
  if (searchTimer) clearTimeout(searchTimer);
});
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

        <el-button
          class="header-search"
          :icon="Search"
          circle
          text
          aria-label="搜索公开信号"
          @click="openSearch"
        />
      </div>
    </div>
  </header>

  <el-dialog
    v-model="isSearchOpen"
    title="搜索公开信号"
    class="site-search-dialog"
    width="min(960px, calc(100% - 32px))"
    align-center
    @closed="resetSearch"
  >
    <div class="site-search-dialog__content">
      <el-input
        v-model="searchKeyword"
        class="site-search-dialog__input"
        :prefix-icon="Search"
        placeholder="搜索标题、摘要或正文"
        clearable
        aria-label="搜索公开信号"
      />
      <div class="site-search-dialog__results">
        <div class="site-search-dialog__results-content">
          <div
            v-if="isSearchLoading"
            class="site-search-dialog__state"
            role="status"
          >
            <el-skeleton
              :rows="6"
              animated
            />
          </div>
          <el-alert
            v-else-if="searchError"
            :title="searchError"
            type="error"
            show-icon
            :closable="false"
          />
          <el-empty
            v-else-if="!searchKeyword.trim()"
            description="输入关键词，搜索公开信号"
          />
          <el-empty
            v-else-if="!searchPosts.length"
            description="没有找到匹配的公开信号。"
          />
          <post-list
            v-else
            :posts="searchPosts"
            @click="isSearchOpen = false"
          />
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.site-header {
  position: fixed;
  z-index: 20;
  top: 0;
  left: 0;
  width: 100vw;
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

.site-header:not(.site-header--scrolled) .header-search:hover,
.site-header:not(.site-header--scrolled) .header-search:focus-visible {
  --el-button-hover-bg-color: #f8fbf8;
  --el-button-hover-text-color: var(--night);
  color: var(--night);
}

:global(.site-search-dialog.el-dialog) {
  display: flex;
  height: min(760px, calc(100vh - 64px));
  margin: auto;
  flex-direction: column;
}

:global(.site-search-dialog .el-dialog__body) {
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.site-search-dialog__content {
  display: flex;
  min-height: 0;
  width: 100%;
  flex-direction: column;
}

.site-search-dialog__input {
  width: auto;
  margin: 0 24px 18px;
}

.site-search-dialog__results {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  scrollbar-color: transparent transparent;
  scrollbar-width: thin;
}

.site-search-dialog__results-content {
  min-height: 100%;
  padding: 0 24px 24px;
}

.site-search-dialog__results::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.site-search-dialog__results:hover {
  scrollbar-color: rgba(224, 181, 73, 0.58) transparent;
}

.site-search-dialog__results::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: transparent;
}

.site-search-dialog__results:hover::-webkit-scrollbar-thumb {
  background: rgba(224, 181, 73, 0.42);
  background-clip: padding-box;
}

.site-search-dialog__results:hover::-webkit-scrollbar-thumb:hover {
  background: rgba(224, 181, 73, 0.7);
}

.site-search-dialog__state {
  padding: 18px 0;
}

@media (max-width: 640px) {
  :global(.site-search-dialog.el-dialog) {
    height: calc(100vh - 32px);
  }

  :global(.site-search-dialog .el-dialog__body) {
    padding: 0;
  }

  .site-search-dialog__input {
    margin: 0 16px 18px;
  }

  .site-search-dialog__results-content {
    padding: 0 16px 16px;
  }

  .site-header__inner {
    gap: 10px;
  }
}
</style>
