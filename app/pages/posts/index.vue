<script setup lang="ts">
import { ArrowRight, DataAnalysis, Promotion, Search } from '@element-plus/icons-vue';
import postsHeroBg from '~/assets/images/bg-posts-lakeside-signal-hero.png';
import sideTopicImage from '~/assets/images/bg-night-mountain-stars.png';
import lakeCover from '~/assets/images/post-cover-lakeside-cabin-night.png';
import deskCover from '~/assets/images/post-cover-writing-desk-dawn.png';
import PostList from '~/components/posts/post-list.vue';
import { getPlanetStats } from '~/services/planet-api';
import { listPosts } from '~/services/post-api';
import { listTopics } from '~/services/topic-api';
import type { PostListItem, PostsPage, PublicTopic } from '~/types/post';
import type { PlanetStats } from '~/types/planet';
import { postDisplayExcerpt, postDisplayTitle } from '~/utils/postDisplay';

useSeoMeta({ title: '星球广场 | 金鱼星球', description: '浏览金鱼星球里的公开信号。' });

const route = useRoute();
const router = useRouter();
const postsViewState = useState('posts-view-state', () => ({
  keyword: '',
  topic: '',
  sort: 'latest' as 'latest' | 'featured',
  page: 1,
  scrollY: 0
}));
const topics = ref<PublicTopic[]>([]);
const pageData = ref<PostsPage | null>(null);
const keyword = ref('');
const selectedTopic = ref('');
const selectedSort = ref<'latest' | 'featured'>('latest');
const displayedSort = ref<'latest' | 'featured'>('latest');
const currentPage = ref(1);
const isLoading = ref(true);
const loadError = ref('');
const isFirstLoad = ref(true);
let postsRequestVersion = 0;
const planetStats = ref<PlanetStats | null>(null);
const isPlanetStatsLoading = ref(true);
const planetStatsError = ref(false);
const pageSize = 6;

const heroPost = computed(() => pageData.value?.items[0] ?? null);
const visiblePosts = computed(() => pageData.value?.items.slice(1) ?? []);
const heroSectionLabel = computed(() => (displayedSort.value === 'featured' ? '精选信号' : '最新抵达'));
const heroLabel = computed(() => (displayedSort.value === 'featured' ? '精选' : '最新'));
const listLabel = computed(() => (displayedSort.value === 'featured' ? '更多精选' : '继续探索'));
const weeklyTopic = computed(() => {
  if (!topics.value.length) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayFromMonday = (today.getDay() + 6) % 7;
  today.setDate(today.getDate() - dayFromMonday);
  const weekSeed = Math.floor(today.getTime() / 604_800_000);
  const randomValue = Math.abs(Math.sin(weekSeed * 12.9898) * 43_758.5453) % 1;
  return topics.value[Math.floor(randomValue * topics.value.length)];
});

function readRouteFilters() {
  keyword.value = typeof route.query.q === 'string' ? route.query.q : postsViewState.value.keyword;
  selectedTopic.value = typeof route.query.topic === 'string' ? route.query.topic : postsViewState.value.topic;
  selectedSort.value =
    route.query.sort === 'featured' ? 'featured' : route.query.sort === 'latest' ? 'latest' : postsViewState.value.sort;

  const page = Number(route.query.page);
  currentPage.value = Number.isInteger(page) && page > 0 ? page : postsViewState.value.page;
  postsViewState.value = {
    keyword: keyword.value,
    topic: selectedTopic.value,
    sort: selectedSort.value,
    page: currentPage.value,
    scrollY: postsViewState.value.scrollY
  };
}

function savePostsScroll() {
  postsViewState.value.scrollY = window.scrollY;
}

function restorePostsScroll() {
  const previousPath = router.options.history.state.back;
  const scrollY = postsViewState.value.scrollY;
  if (typeof previousPath !== 'string' || !/^\/posts\//.test(previousPath) || scrollY <= 0) return;

  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'auto' }));
    });
  });
}

function postCover(post: PostListItem | null, index = 0) {
  return post?.coverImage?.url ?? (index % 2 === 0 ? lakeCover : deskCover);
}

function formatDate(value: string) {
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('.');
}

function settleLatestPostsRequest(requestVersion: number, update: () => void) {
  if (requestVersion !== postsRequestVersion) return;

  update();
  isLoading.value = false;
  isFirstLoad.value = false;
}

async function loadPosts() {
  const requestVersion = ++postsRequestVersion;
  const requestFilters = {
    topic: selectedTopic.value || undefined,
    q: keyword.value.trim() || undefined,
    sort: selectedSort.value,
    page: currentPage.value,
    pageSize
  };

  isLoading.value = true;
  loadError.value = '';
  try {
    const result = await listPosts(requestFilters);
    settleLatestPostsRequest(requestVersion, () => {
      pageData.value = result;
      displayedSort.value = requestFilters.sort;
    });
  } catch {
    settleLatestPostsRequest(requestVersion, () => {
      pageData.value = null;
      loadError.value = '星球信号暂时无法读取，请稍后再试。';
    });
  }
}

async function loadTopics() {
  try {
    topics.value = await listTopics();
  } catch {
    topics.value = [];
  }
}

async function loadPlanetStats() {
  isPlanetStatsLoading.value = true;
  planetStatsError.value = false;
  try {
    planetStats.value = await getPlanetStats();
  } catch {
    planetStats.value = null;
    planetStatsError.value = true;
  } finally {
    isPlanetStatsLoading.value = false;
  }
}

function applyFilters(overrides: { topic?: string; q?: string; page?: number; sort?: 'latest' | 'featured' }) {
  if (overrides.topic !== undefined) selectedTopic.value = overrides.topic;
  if (overrides.q !== undefined) keyword.value = overrides.q;
  if (overrides.sort !== undefined) selectedSort.value = overrides.sort;
  if (overrides.page !== undefined) currentPage.value = overrides.page;
  postsViewState.value = {
    keyword: keyword.value,
    topic: selectedTopic.value,
    sort: selectedSort.value,
    page: currentPage.value,
    scrollY: postsViewState.value.scrollY
  };
  void loadPosts();
}

function selectTopic(topic: string) {
  applyFilters({ topic, page: 1 });
}
function submitSearch() {
  applyFilters({ q: keyword.value.trim(), page: 1 });
}
function selectSort(sort: 'latest' | 'featured') {
  if (sort === selectedSort.value) return;

  applyFilters({ sort, page: 1 });
}
function changePage(page: number) {
  applyFilters({ page });
}
function clearFilters() {
  applyFilters({ topic: '', q: '', sort: 'latest', page: 1 });
}

onMounted(async () => {
  readRouteFilters();
  await Promise.all([loadTopics(), loadPosts(), loadPlanetStats()]);
  restorePostsScroll();
});
onBeforeUnmount(savePostsScroll);
watch(
  () => route.query,
  () => {
    readRouteFilters();
    if (!isFirstLoad.value) void loadPosts();
  }
);
</script>

<template>
  <div class="posts-page">
    <section
      class="posts-hero page-photo-hero"
      :style="{
        backgroundImage: `linear-gradient(90deg, rgba(5, 15, 18, 0.68), rgba(5, 15, 18, 0.12)), url(${postsHeroBg})`
      }"
    >
      <div class="shell-container posts-hero__inner flex h-full min-h-0 flex-col justify-center pt-[82px]">
        <p class="eyebrow eyebrow--light">A SMALLER BRIGHTER PLACE</p>
        <h1 class="planet-hero-title m-0 text-[50px] font-bold leading-[1.05] md:text-[76px]">星球广场</h1>
        <p class="mt-[15px] mb-[26px] max-w-[560px] text-[19px] font-semibold leading-[1.8] text-[#f6f8f1]">
          把想说的话，投进一颗小小的星球。
        </p>
        <nuxt-link
          v-slot="{ navigate }"
          class="self-start"
          to="/write"
          custom
        >
          <el-button
            type="primary"
            size="large"
            class="arrow-hover"
            @click="navigate"
          >
            投递新信号
            <span aria-hidden="true">→</span>
          </el-button>
        </nuxt-link>
      </div>
    </section>

    <section class="posts-board shell-container flex gap-8 py-[26px]">
      <main
        class="posts-feed"
        :class="{ 'posts-feed--loading': isLoading && pageData }"
      >
        <div class="posts-toolbar flex items-center gap-6">
          <form
            class="posts-filter__search"
            role="search"
            @submit.prevent="submitSearch"
          >
            <el-input
              v-model="keyword"
              :prefix-icon="Search"
              placeholder="搜索标题、摘要或正文"
              clearable
              aria-label="搜索信号"
            />
          </form>
          <el-select
            class="posts-topic-select"
            :model-value="selectedTopic"
            aria-label="按主题筛选"
            @change="selectTopic"
          >
            <el-option
              label="全部主题"
              value=""
            />
            <el-option
              v-for="topic in topics"
              :key="topic.slug"
              :label="topic.name"
              :value="topic.slug"
            />
          </el-select>
          <div
            class="posts-tabs ml-auto flex items-center"
            :class="{ 'posts-tabs--featured': selectedSort === 'featured' }"
          >
            <button
              class="posts-tabs__item"
              :class="{ 'posts-tabs__item--active': selectedSort === 'latest' }"
              type="button"
              @click="selectSort('latest')"
            >
              最新
            </button>
            <button
              class="posts-tabs__item"
              :class="{ 'posts-tabs__item--active': selectedSort === 'featured' }"
              type="button"
              @click="selectSort('featured')"
            >
              精选
            </button>
          </div>
        </div>
        <div class="posts-content">
          <div
            v-if="isLoading && !pageData"
            class="posts-state flex min-h-[370px] flex-col items-center justify-center gap-[18px]"
            role="status"
            aria-live="polite"
          >
            <el-skeleton
              :rows="6"
              animated
            />
          </div>
          <div
            v-else-if="loadError"
            class="posts-state flex min-h-[370px] flex-col items-center justify-center gap-[18px]"
            role="alert"
          >
            <el-alert
              :title="loadError"
              type="error"
              show-icon
              :closable="false"
            />
            <el-button
              type="primary"
              @click="loadPosts"
              >重新连接</el-button
            >
          </div>
          <div
            v-else-if="!pageData?.items.length"
            class="posts-empty-state flex flex-col items-center justify-center gap-[18px]"
          >
            <el-empty description="没有找到匹配的公开信号。">
              <el-button
                type="primary"
                @click="clearFilters"
                >清除筛选</el-button
              >
            </el-empty>
          </div>
          <template v-else>
            <section
              class="posts-spotlight"
              :aria-label="heroSectionLabel"
            >
              <div class="posts-section-head">
                <h2>{{ heroSectionLabel }}</h2>
              </div>
              <nuxt-link
                v-if="heroPost"
                class="posts-spotlight__card arrow-hover"
                :to="`/posts/${heroPost.slug}`"
              >
                <span class="posts-spotlight__image">
                  <span class="posts-spotlight__label">{{ heroLabel }}</span>
                  <img
                    :src="postCover(heroPost)"
                    :alt="heroPost.coverImage?.altText || heroPost.topic.name"
                    loading="eager"
                  />
                </span>
                <span class="posts-spotlight__body">
                  <strong>{{ postDisplayTitle(heroPost) }}</strong>
                  <span
                    v-if="postDisplayExcerpt(heroPost)"
                    class="posts-spotlight__excerpt"
                    >{{ postDisplayExcerpt(heroPost) }}</span
                  >
                  <span class="posts-spotlight__meta">
                    <span class="posts-meta-chip"># {{ heroPost.topic.name }}</span>
                    <time :datetime="heroPost.publishedAt">{{ formatDate(heroPost.publishedAt) }}</time>
                    <span>{{ heroPost.readingMinutes }} 分钟阅读</span>
                  </span>
                </span>
                <el-icon
                  class="posts-spotlight__arrow"
                  aria-hidden="true"
                >
                  <arrow-right />
                </el-icon>
              </nuxt-link>
            </section>
            <section
              class="posts-list-section"
              :aria-label="listLabel"
            >
              <div class="posts-section-head">
                <h2>{{ listLabel }}</h2>
              </div>
              <post-list :posts="visiblePosts" />
            </section>
            <div class="posts-pagination-slot">
              <nav
                v-if="pageData.totalPages > 1"
                class="posts-pagination flex justify-center mt-4"
                aria-label="信号分页"
              >
                <el-pagination
                  background
                  layout="prev, pager, next"
                  :current-page="pageData.page"
                  :page-size="pageData.pageSize"
                  :total="pageData.total"
                  @current-change="changePage"
                />
              </nav>
            </div>
          </template>
        </div>
      </main>

      <aside class="posts-side">
        <section class="side-topic side-panel">
          <h2 class="side-panel__title"><span aria-hidden="true">#</span> 本周主题</h2>
          <img
            :src="sideTopicImage"
            :alt="weeklyTopic ? `${weeklyTopic.name}主题图片` : '本周主题图片'"
          />
          <h2 class="side-topic__name">{{ weeklyTopic?.name ?? '本周主题' }}</h2>
          <p>{{ weeklyTopic?.description ?? '本周主题正在准备中。' }}</p>
          <nuxt-link
            v-slot="{ navigate }"
            :to="weeklyTopic ? { path: '/write', query: { topic: weeklyTopic.slug } } : '/write'"
            custom
          >
            <el-button
              type="primary"
              class="arrow-hover"
              @click="navigate"
              >参与本周主题 <span aria-hidden="true">→</span></el-button
            >
          </nuxt-link>
        </section>
        <section class="planet-status side-panel">
          <h2 class="side-panel__title">
            <el-icon><data-analysis /></el-icon> 星球状态
          </h2>
          <div class="planet-status__grid">
            <div>
              <strong>{{ isPlanetStatsLoading ? '—' : (planetStats?.memberCount ?? '—').toLocaleString() }}</strong>
              <span>星球成员</span>
            </div>
            <div>
              <strong>{{ isPlanetStatsLoading ? '—' : (planetStats?.signalCount ?? '—').toLocaleString() }}</strong>
              <span>信号总数</span>
            </div>
            <div>
              <strong>{{
                isPlanetStatsLoading ? '—' : (planetStats?.weeklySignalCount ?? '—').toLocaleString()
              }}</strong>
              <span>本周新增</span>
            </div>
          </div>
          <p
            v-if="planetStatsError"
            class="planet-status__error"
            role="status"
          >
            星球状态暂时无法读取
          </p>
        </section>
        <section
          class="side-write"
          :style="{
            backgroundImage: `linear-gradient(135deg, rgba(7, 21, 24, 0.9), rgba(9, 32, 34, 0.68)), url(${sideTopicImage})`
          }"
        >
          <div class="side-write__icon">
            <el-icon><promotion /></el-icon>
          </div>
          <h2>投递新信号</h2>
          <p>把此刻的想法、故事或灵感，投进这颗小小的星球。</p>
          <nuxt-link
            v-slot="{ navigate }"
            to="/write"
            custom
          >
            <el-button
              type="primary"
              class="arrow-hover"
              @click="navigate"
              >投递新信号 <span aria-hidden="true">→</span></el-button
            >
          </nuxt-link>
        </section>
      </aside>
    </section>
  </div>
</template>

<style scoped lang="scss">
.posts-page {
  background: #f7f8f3;
}

.eyebrow--light {
  color: #dce8df;
}

.posts-hero {
  color: #f7faf7;
  background-color: var(--night);
}

.posts-feed {
  display: flex;
  min-width: 0;
  height: 800px;
  flex: 1 1 auto;
  flex-direction: column;
}

.posts-feed--loading {
  pointer-events: none;
  cursor: wait;
}

.posts-empty-state {
  min-height: 0;
  flex: 1;
}

.posts-content {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.posts-pagination-slot {
  display: flex;
  height: 52px;
  flex: 0 0 52px;
  align-items: flex-end;
  justify-content: center;
}

.posts-toolbar {
  min-height: 52px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.posts-filter__search {
  flex: 1 1 290px;
  max-width: 295px;
  padding: 0;
}

.posts-filter__search :deep(.el-input__wrapper),
.posts-topic-select :deep(.el-select__wrapper) {
  min-height: 38px;
  border: 1px solid #d8ded9;
  border-radius: 3px;
  background: #fff;
  box-shadow: none;
}

.posts-topic-select {
  width: 160px;
}

.posts-tabs {
  margin: 0;
  border: 0;
}

.posts-tabs__item {
  min-width: 80px;
  height: 38px;
  padding: 0 22px;
  border: 1px solid var(--line);
  color: var(--muted);
  background: #fff;
  font-size: 13px;
}

.posts-tabs__item + .posts-tabs__item {
  border-left: 0;
}

.posts-tabs__item--active {
  color: #fff;
  background: var(--night);
  border-color: var(--night);
}

.posts-tabs--featured .posts-tabs__item--active {
  color: var(--ink);
  background: var(--accent);
  border-color: var(--accent);
}

.posts-spotlight__card {
  display: flex;
  color: var(--ink);
  gap: 22px;
  padding: 9px 0;
  transition: color 0.2s ease;
}

.posts-spotlight__card:hover,
.posts-spotlight__card:focus-visible {
  color: var(--accent-deep);
}

.posts-spotlight__image {
  position: relative;
  flex: 0 0 43%;
  min-height: 0;
  overflow: hidden;
  aspect-ratio: 2.85;
  background: #d8ddd6;
  border-radius: 3px;
}

.posts-spotlight__image img {
  display: block;
  width: 100%;
  height: 100%;
  aspect-ratio: auto;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.posts-spotlight__label {
  position: absolute;
  z-index: 1;
  top: 14px;
  left: 14px;
  width: fit-content;
  padding: 6px 10px;
  color: var(--ink);
  background: var(--accent);
  border-radius: 2px;
  font-size: 12px;
  font-weight: 700;
}

.posts-spotlight__body {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  padding: 2px 0 0;
}

.posts-spotlight__card strong {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ink);
  font-size: 21px;
  line-height: 1.4;
  transition: color 0.2s ease;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.posts-spotlight__excerpt {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 8px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.65;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
  white-space: normal;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.posts-spotlight__card:hover strong,
.posts-spotlight__card:hover .posts-spotlight__excerpt,
.posts-spotlight__card:focus-visible strong,
.posts-spotlight__card:focus-visible .posts-spotlight__excerpt {
  color: var(--accent-deep);
}

.posts-spotlight__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  margin-top: auto;
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
}

.posts-meta-chip {
  padding: 5px 9px;
  color: var(--muted);
  background: #f0f2ef;
  border-radius: 3px;
}

.posts-spotlight__meta time::before,
.posts-spotlight__meta > span:nth-of-type(2)::before {
  margin-right: 14px;
  color: #b2bbb4;
  content: '/';
}

.posts-spotlight__arrow {
  align-self: center;
  margin-left: auto;
  color: var(--ink);
  font-size: 17px;
  transition:
    transform 0.2s ease,
    color 0.2s ease;
}

.posts-spotlight__card:hover .posts-spotlight__arrow,
.posts-spotlight__card:focus-visible .posts-spotlight__arrow {
  color: var(--accent-deep);
}

.posts-spotlight__card:hover .posts-spotlight__image img {
  transform: scale(1.04);
}

.posts-section-head {
  display: flex;
  position: relative;
  align-items: center;
  padding: 10px 0 10px 14px;
  border-bottom: 1px solid var(--line);
}

.posts-section-head::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 5px;
  height: 19px;
  margin-left: -14px;
  background: var(--accent);
  content: '';
  transform: translateY(-50%);
}

.posts-section-head h2 {
  margin: 0;
  color: var(--ink);
  font-size: 19px;
  font-weight: 700;
}

.posts-list-section {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.posts-side {
  width: 330px;
  flex: 0 0 330px;
  position: sticky;
  top: 98px;
}

.side-panel {
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}

.side-panel__title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 16px;
  color: var(--ink);
  font-size: 19px;
  font-weight: 700;
}

.side-panel__title > span,
.side-panel__title :deep(.el-icon) {
  color: var(--accent-deep);
}

.side-topic img {
  display: block;
  width: 100%;
  height: 100%;
  aspect-ratio: 2.65;
  object-position: center 28%;
  object-fit: cover;
  border-radius: 3px;
}

.side-topic__name {
  margin: 13px 0 4px;
  font-size: 24px;
}

.side-topic p:not(.eyebrow) {
  margin: 0 0 16px;
  font-size: 14px;
  line-height: 1.7;
}

.side-topic .el-button {
  width: 100%;
  min-height: 40px;
}

.planet-status {
  padding-top: 18px;
}

.planet-status__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 14px 0;
  background: #f1f3ef;
}

.planet-status__grid > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  text-align: center;
}

.planet-status__grid > div + div {
  border-left: 1px solid #d9ded9;
}

.planet-status__grid strong {
  color: var(--ink);
  font-size: 21px;
  line-height: 1.2;
}

.planet-status__grid span {
  color: var(--muted);
  font-size: 11px;
  white-space: nowrap;
}

.planet-status__error {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  text-align: center;
}

.side-write {
  min-height: 220px;
  margin-top: 18px;
  padding: 22px;
  overflow: hidden;
  color: #f7faf7;
  background-color: var(--night);
  background-position: center;
  background-size: cover;
  border-radius: 3px;
}

.side-write__icon {
  color: var(--accent);
  font-size: 26px;
}

.side-write h2 {
  margin: 8px 0 8px;
  color: #fff;
  font-size: 22px;
}

.side-write p {
  max-width: 240px;
  margin: 0 0 18px;
  color: #dbe7df;
  font-size: 13px;
  line-height: 1.7;
}

.side-write .el-button {
  min-height: 38px;
}

@media (max-width: 1024px) {
  .posts-board {
    flex-direction: column;
  }

  .posts-side {
    position: static;
    width: auto;
    flex-basis: auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .side-write {
    margin-top: 0;
  }
}

@media (max-width: 700px) {
  .posts-toolbar {
    flex-wrap: wrap;
    gap: 10px;
  }

  .posts-filter__search {
    max-width: none;
    flex-basis: 100%;
  }

  .posts-topic-select {
    flex: 1;
  }

  .posts-tabs {
    margin-left: 0 !important;
  }

  .posts-spotlight__card {
    flex-direction: column;
    gap: 14px;
  }

  .posts-spotlight__image {
    flex-basis: auto;
    width: 100%;
    aspect-ratio: 2.1;
  }

  .posts-spotlight__body {
    padding: 0;
  }

  .posts-side {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 500px) {
  .posts-board {
    width: min(var(--container), calc(100% - 32px));
  }
}
</style>
