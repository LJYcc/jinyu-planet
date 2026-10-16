<script setup lang="ts">
import { ArrowLeft, Clock, CopyDocument } from '@element-plus/icons-vue';
import detailBandBg from '~/assets/images/bg-posts-lakeside-signal-hero.png';
import ArticleContent from '~/components/posts/article-content.vue';
import { getPostDetail } from '~/services/post-api';
import type { PostDetail } from '~/types/post';
import { postDisplayTitle } from '~/utils/postDisplay';

const route = useRoute();
const router = useRouter();
const post = ref<PostDetail | null>(null);
const isLoading = ref(true);
const loadError = ref('');
const isNotFound = ref(false);

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

function returnToPosts() {
  const previousPath = router.options.history.state.back;
  if (typeof previousPath === 'string' && /^\/posts(?:\?|$)/.test(previousPath)) {
    router.back();
    return;
  }
  void router.push('/posts');
}

async function loadPost() {
  const slug = typeof route.params.slug === 'string' ? route.params.slug : '';
  isLoading.value = true;
  loadError.value = '';
  isNotFound.value = false;
  post.value = null;
  try {
    post.value = await getPostDetail(slug);
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
          @click.prevent="returnToPosts"
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
            <div class="post-detail__taxonomy flex flex-wrap items-center gap-2">
              <div class="post-detail__topic">
                <span aria-hidden="true">#</span>
                {{ post.topic.name }}
              </div>
              <div
                v-if="post.tags.length"
                class="post-detail__tags flex flex-wrap gap-2"
                aria-label="标签"
              >
                <el-tag
                  v-for="tag in post.tags"
                  :key="tag.slug"
                  class="post-detail__tag"
                  effect="plain"
                  round
                  size="small"
                >
                  {{ tag.name }}
                </el-tag>
              </div>
            </div>
            <h1>{{ postDisplayTitle(post) }}</h1>
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

          <article-content :html="post.contentHtml" />

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

        <!-- 详情页仅展示当前帖子的内容，不再渲染右侧信息、CTA 和相关推荐。 -->
        <!--
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
        -->
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.post-detail-page {
  background: #f7f8f3;
}

.post-detail-band {
  min-height: 126px;
  padding-top: 78px;
  color: #f7faf7;
  background-color: var(--night);
  background-position: center;
  background-size: cover;
}

.post-detail-band__inner {
  display: flex;
  min-height: 48px;
  align-items: center;
  padding-bottom: 8px;
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
  height: calc(100vh - 126px);
  padding-top: 28px;
  padding-bottom: 28px;
}

.post-detail__state :deep(.el-skeleton) {
  width: min(100%, 760px);
}

.post-detail-layout {
  display: block;
  height: 100%;
  overflow-y: auto;
  max-width: 960px;
  margin: 0 auto;
  scrollbar-color: transparent transparent;
}

.post-detail-layout:hover {
  scrollbar-color: rgba(224, 181, 73, 0.58) transparent;
}

.post-detail-layout::-webkit-scrollbar-thumb {
  background: transparent;
}

.post-detail-layout:hover::-webkit-scrollbar-thumb {
  background: rgba(224, 181, 73, 0.42);
  background-clip: padding-box;
}

.post-detail-layout:hover::-webkit-scrollbar-thumb:hover {
  background: rgba(224, 181, 73, 0.7);
  background-clip: padding-box;
}

.post-detail__article {
  min-width: 0;
}

.post-detail__header {
  padding-bottom: 18px;
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

.post-detail__tag {
  --el-tag-bg-color: #f4f6f2;
  --el-tag-border-color: #d8dfd7;
  --el-tag-text-color: #526158;
  font-weight: 600;
}

.post-detail__header h1 {
  max-width: 800px;
  margin: 10px 0 0;
  color: var(--ink);
  font-size: clamp(32px, 3vw, 42px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.post-detail__meta {
  margin-top: 10px;
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

.post-detail__images img {
  display: block;
  width: 100%;
  max-height: 680px;
  object-fit: cover;
}

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

@media (max-width: 600px) {
  .post-detail-band {
    min-height: 118px;
    padding-top: 68px;
  }

  .post-detail-band__inner {
    min-height: 50px;
    padding-bottom: 8px;
  }

  .post-detail-band__back {
    font-size: 12px;
  }

  .post-detail-content {
    height: calc(100vh - 118px);
    padding-top: 22px;
    padding-bottom: 22px;
  }

  .post-detail__header h1 {
    font-size: 30px;
  }

  .post-detail__copy {
    flex-basis: 100%;
    margin-left: 0;
  }
}
</style>
