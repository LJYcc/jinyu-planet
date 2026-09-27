<script setup lang="ts">
import { ArrowLeft, Calendar, Clock, CopyDocument, User } from '@element-plus/icons-vue';
import detailBandBg from '~/assets/images/bg-posts-lakeside-signal-hero.png';
import detailCtaBg from '~/assets/images/bg-night-mountain-stars.png';
import deskCover from '~/assets/images/post-cover-writing-desk-dawn.png';
import lakeCover from '~/assets/images/post-cover-lakeside-cabin-night.png';
import type { ApiSuccess } from '~/types/api';
import type { PostDetail, PostListItem } from '~/types/post';
import { postDisplayExcerpt, postDisplayTitle } from '~/utils/postDisplay';

const route = useRoute();
const post = ref<PostDetail | null>(null);
const isLoading = ref(true);
const loadError = ref('');
const isNotFound = ref(false);

const relatedPosts = computed(() => post.value?.recommendations.slice(0, 3) ?? []);

useSeoMeta({
  title: () => (post.value ? `${postDisplayTitle(post.value)} | 金鱼星球` : '信号阅读 | 金鱼星球'),
  description: () => post.value?.excerpt ?? '阅读金鱼星球里的公开信号。'
});

function formatDate(value: string) {
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('.');
}

function postCover(value: PostListItem, index: number) {
  return value.coverImage?.url ?? (index % 2 === 0 ? lakeCover : deskCover);
}

async function loadPost() {
  const slug = typeof route.params.slug === 'string' ? route.params.slug : '';
  isLoading.value = true;
  loadError.value = '';
  isNotFound.value = false;
  post.value = null;
  try {
    const response = await $fetch<ApiSuccess<PostDetail>>(`/api/posts/${encodeURIComponent(slug)}`);
    post.value = response.data;
  } catch (error: unknown) {
    const status =
      (error as { response?: { status?: number }; statusCode?: number }).response?.status ??
      (error as { statusCode?: number }).statusCode;
    isNotFound.value = status === 404;
    if (!isNotFound.value) loadError.value = '这条信号暂时无法读取，请稍后再试。';
  } finally {
    isLoading.value = false;
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    ElMessage.success('链接已复制');
  } catch {
    ElMessage.error('复制失败，请手动复制地址栏链接');
  }
}

onMounted(() => void loadPost());
watch(
  () => route.params.slug,
  () => void loadPost()
);
</script>

<template>
  <div class="post-detail-page">
    <section
      class="post-detail-band"
      :style="{
        backgroundImage: `linear-gradient(90deg, rgba(5, 15, 18, 0.9), rgba(5, 15, 18, 0.35)), url(${detailBandBg})`
      }"
    >
      <div class="shell-container post-detail-band__inner">
        <nuxt-link
          class="post-detail-band__back inline-flex items-center gap-2"
          to="/posts"
        >
          <el-icon><arrow-left /></el-icon>
          <span>返回星球广场</span>
          <span
            class="post-detail-band__separator"
            aria-hidden="true"
            >/</span
          >
          <span>信号详情</span>
        </nuxt-link>
      </div>
    </section>

    <div class="shell-container post-detail-content">
      <div
        v-if="isLoading"
        class="post-detail__state flex min-h-[520px] flex-col items-center justify-center gap-[18px]"
        role="status"
      >
        <el-skeleton
          :rows="10"
          animated
        />
      </div>
      <div
        v-else-if="isNotFound"
        class="post-detail__state flex min-h-[520px] flex-col items-center justify-center gap-[18px]"
      >
        <el-empty description="这条信号没有抵达星球，或暂未公开。">
          <nuxt-link
            v-slot="{ navigate }"
            to="/posts"
            custom
          >
            <el-button
              type="primary"
              @click="navigate"
              >返回星球广场</el-button
            >
          </nuxt-link>
        </el-empty>
      </div>
      <div
        v-else-if="loadError"
        class="post-detail__state flex min-h-[520px] flex-col items-center justify-center gap-[18px]"
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
          @click="loadPost"
          >重新连接</el-button
        >
      </div>
      <div
        v-else-if="post"
        class="post-detail-layout"
      >
        <article class="post-detail__article">
          <header class="post-detail__header">
            <div class="post-detail__topic">
              <span aria-hidden="true">#</span>
              {{ post.topic.name }}
            </div>
            <h1>{{ postDisplayTitle(post) }}</h1>
            <p v-if="postDisplayExcerpt(post)">{{ postDisplayExcerpt(post) }}</p>
            <div class="post-detail__meta flex flex-wrap items-center gap-[10px] max-[600px]:gap-2">
              <span class="post-detail__author">
                <span
                  class="post-detail__author-avatar"
                  aria-hidden="true"
                  >{{ post.author.nickname.slice(0, 1) }}</span
                >
                <strong>{{ post.author.nickname }}</strong>
              </span>
              <span
                class="post-detail__meta-separator"
                aria-hidden="true"
                >/</span
              >
              <span>{{ formatDate(post.publishedAt) }}</span>
              <span
                class="post-detail__meta-separator"
                aria-hidden="true"
                >/</span
              >
              <span class="inline-flex items-center gap-1">
                <el-icon><clock /></el-icon>
                {{ post.readingMinutes }} 分钟阅读
              </span>
              <el-button
                :icon="CopyDocument"
                text
                size="small"
                class="post-detail__copy"
                aria-label="复制信号链接"
                @click="copyLink"
              >
                复制链接
              </el-button>
            </div>
          </header>

          <figure
            v-if="post.coverImage"
            class="post-detail__cover"
          >
            <img
              :src="post.coverImage.url"
              :alt="post.coverImage.altText"
            />
            <figcaption v-if="post.coverImage.caption">{{ post.coverImage.caption }}</figcaption>
          </figure>

          <article-content :html="post.contentHtml" />

          <div
            v-if="post.images.length"
            class="post-detail__images"
          >
            <figure
              v-for="image in post.images"
              :key="image.url"
            >
              <img
                :src="image.url"
                :alt="image.altText"
                loading="lazy"
              />
              <figcaption v-if="image.caption">{{ image.caption }}</figcaption>
            </figure>
          </div>

          <a
            v-if="post.externalUrl"
            class="post-detail__external inline-flex items-center gap-2"
            :href="post.externalUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            打开原始链接 <span aria-hidden="true">↗</span>
          </a>
        </article>

        <aside class="post-detail__side">
          <section class="detail-side-block">
            <h2 class="detail-side-title">信号信息</h2>
            <dl class="detail-side-meta">
              <div>
                <dt>
                  <el-icon><user /></el-icon>
                  署名
                </dt>
                <dd>{{ post.author.nickname }}</dd>
              </div>
              <div>
                <dt>
                  <el-icon><calendar /></el-icon>
                  日期
                </dt>
                <dd>{{ formatDate(post.publishedAt) }}</dd>
              </div>
              <div>
                <dt>
                  <el-icon><clock /></el-icon>
                  阅读
                </dt>
                <dd>{{ post.readingMinutes }} 分钟</dd>
              </div>
            </dl>
          </section>

          <section
            v-if="post.tags.length"
            class="detail-side-block"
          >
            <h2 class="detail-side-title">标签</h2>
            <div class="detail-side-tags flex flex-wrap gap-2">
              <el-tag
                v-for="tag in post.tags"
                :key="tag.slug"
                effect="plain"
                round
                >{{ tag.name }}</el-tag
              >
            </div>
          </section>

          <section
            class="detail-side-cta"
            :style="{
              backgroundImage: `linear-gradient(135deg, rgba(7, 21, 24, 0.9), rgba(9, 32, 34, 0.68)), url(${detailCtaBg})`
            }"
          >
            <span
              class="detail-side-cta__mark"
              aria-hidden="true"
              >↗</span
            >
            <h2>也想写一条信号？</h2>
            <p>把你的想法、故事或灵感，投进这颗小小的星球。</p>
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

          <section
            v-if="relatedPosts.length"
            class="detail-side-block detail-related"
          >
            <div class="detail-related__heading">
              <h2 class="detail-side-title">同一轨道上的信号</h2>
              <nuxt-link
                class="detail-related__more"
                to="/posts"
                >查看更多 <span aria-hidden="true">→</span></nuxt-link
              >
            </div>
            <nuxt-link
              v-for="(relatedPost, index) in relatedPosts"
              :key="relatedPost.slug"
              class="detail-related__item"
              :to="`/posts/${relatedPost.slug}`"
            >
              <span class="detail-related__image">
                <img
                  :src="postCover(relatedPost, index)"
                  :alt="relatedPost.coverImage?.altText || relatedPost.topic.name"
                  loading="lazy"
                />
              </span>
              <span class="min-w-0">
                <strong>{{ postDisplayTitle(relatedPost) }}</strong>
                <small>{{ relatedPost.topic.name }} · {{ relatedPost.readingMinutes }} 分钟阅读</small>
              </span>
            </nuxt-link>
          </section>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.post-detail-page {
  background: #f7f8f3;
}

.post-detail-band {
  min-height: 158px;
  padding-top: 78px;
  color: #f7faf7;
  background-color: var(--night);
  background-position: center;
  background-size: cover;
}

.post-detail-band__inner {
  display: flex;
  min-height: 80px;
  align-items: center;
  padding-bottom: 18px;
}

.post-detail-band__back {
  color: #f1f6f1;
  font-size: 14px;
  font-weight: 700;
}

.post-detail-band__back:hover {
  color: var(--accent);
}

.post-detail-band__separator {
  color: #82948d;
  font-weight: 400;
}

.post-detail-content {
  padding-top: 36px;
  padding-bottom: 112px;
}

.post-detail__state :deep(.el-skeleton) {
  width: min(100%, 760px);
}

.post-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 54px;
  align-items: start;
}

.post-detail__article {
  min-width: 0;
}

.post-detail__header {
  padding-bottom: 30px;
  border-bottom: 1px solid var(--line);
}

.post-detail__topic {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  color: #9a7b16;
  background: #fbf0c8;
  font-size: 12px;
  font-weight: 700;
}

.post-detail__topic span {
  color: var(--accent-deep);
}

.post-detail__header h1 {
  max-width: 800px;
  margin: 17px 0 14px;
  color: var(--ink);
  font-size: clamp(34px, 4.5vw, 54px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.post-detail__header > p {
  max-width: 790px;
  margin: 0;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.85;
}

.post-detail__meta {
  margin-top: 22px;
  color: var(--muted);
  font-size: 12px;
}

.post-detail__author {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--ink);
}

.post-detail__author-avatar {
  display: inline-grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  color: #eef5ef;
  background: var(--night-soft);
  font-size: 12px;
  font-weight: 700;
}

.post-detail__meta-separator {
  color: #b6beb8;
}

.post-detail__copy {
  margin-left: auto;
}

.post-detail__cover {
  margin: 34px 0 36px;
}

.post-detail__cover img,
.post-detail__images img {
  display: block;
  width: 100%;
  max-height: 680px;
  object-fit: cover;
}

.post-detail__cover img {
  aspect-ratio: 16 / 9;
}

.post-detail__cover figcaption,
.post-detail__images figcaption {
  margin-top: 9px;
  color: var(--muted);
  font-size: 12px;
  text-align: center;
}

.post-detail__images {
  display: grid;
  gap: 20px;
  margin: 38px 0;
}

.post-detail__images figure {
  margin: 0;
}

.post-detail__external {
  margin-top: 34px;
  color: var(--accent-deep);
  font-size: 14px;
  font-weight: 700;
}

.post-detail__external:hover {
  color: var(--ink);
}

.post-detail__side {
  position: sticky;
  top: 104px;
  min-width: 0;
  padding-left: 30px;
  border-left: 1px solid var(--line);
}

.detail-side-block {
  padding-bottom: 28px;
  border-bottom: 1px solid var(--line);
}

.detail-side-block + .detail-side-block {
  padding-top: 26px;
}

.detail-side-title {
  position: relative;
  margin: 0 0 20px;
  padding-left: 14px;
  color: var(--ink);
  font-size: 19px;
  font-weight: 700;
}

.detail-side-title::before {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 0;
  width: 4px;
  background: var(--accent);
  content: '';
}

.detail-side-meta {
  display: grid;
  gap: 15px;
  margin: 0;
}

.detail-side-meta div {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  font-size: 13px;
}

.detail-side-meta dt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
}

.detail-side-meta dt :deep(.el-icon) {
  color: #798780;
  font-size: 16px;
}

.detail-side-meta dd {
  margin: 0;
  overflow: hidden;
  color: var(--ink);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-side-tags :deep(.el-tag) {
  border-color: #e1e6df;
  color: var(--muted);
  background: #f4f6f1;
}

.detail-side-cta {
  margin: 28px 0;
  padding: 22px;
  color: #f3f8f2;
  background-position: center;
  background-size: cover;
}

.detail-side-cta__mark {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  margin-bottom: 14px;
  color: var(--night);
  background: var(--accent);
  font-size: 18px;
  font-weight: 700;
}

.detail-side-cta h2 {
  margin: 0 0 8px;
  font-size: 19px;
  font-weight: 700;
}

.detail-side-cta p {
  margin: 0 0 18px;
  color: #c8d5cd;
  font-size: 13px;
  line-height: 1.75;
}

.detail-related {
  padding-bottom: 0;
  border-bottom: 0;
}

.detail-related__heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.detail-related__more {
  flex: 0 0 auto;
  color: var(--muted);
  font-size: 12px;
}

.detail-related__more:hover {
  color: var(--accent-deep);
}

.detail-related__item {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 11px 0;
  color: var(--ink);
}

.detail-related__item:hover {
  color: var(--accent-deep);
}

.detail-related__image {
  display: block;
  width: 82px;
  aspect-ratio: 1.3;
  overflow: hidden;
}

.detail-related__image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.detail-related__item:hover .detail-related__image img {
  transform: scale(1.05);
}

.detail-related__item strong,
.detail-related__item small {
  display: block;
}

.detail-related__item strong {
  display: -webkit-box;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.detail-related__item small {
  margin-top: 5px;
  color: var(--muted);
  font-size: 11px;
}

@media (max-width: 900px) {
  .post-detail-layout {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .post-detail__side {
    position: static;
    padding-top: 32px;
    padding-left: 0;
    border-top: 1px solid var(--line);
    border-left: 0;
  }
}

@media (max-width: 600px) {
  .post-detail-band {
    min-height: 136px;
    padding-top: 68px;
  }

  .post-detail-band__inner {
    min-height: 68px;
    padding-bottom: 12px;
  }

  .post-detail-band__back {
    font-size: 12px;
  }

  .post-detail-content {
    padding-top: 26px;
    padding-bottom: 78px;
  }

  .post-detail__header h1 {
    font-size: 32px;
  }

  .post-detail__copy {
    margin-left: 0;
  }

  .post-detail__cover {
    margin-top: 26px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .detail-related__image img {
    transition: none;
  }
}
</style>
