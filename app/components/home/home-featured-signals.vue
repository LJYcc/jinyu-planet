<script setup lang="ts">
import type { PostListItem } from '~/types/post';
import { postDisplayExcerpt, postDisplayTitle } from '~/utils/postDisplay';

const props = defineProps<{
  featuredPost: PostListItem | null;
  supportingPosts: PostListItem[];
  postsCount: number;
  isLoading: boolean;
  loadError: string;
  formatDate: (value: string) => string;
  postCover: (post: PostListItem | null, index?: number) => string;
  loadHomeData: () => Promise<void>;
}>();
</script>

<template>
  <section class="signals-section section-band">
    <div class="shell-container">
      <div class="section-heading flex items-end justify-between gap-6 max-[820px]:flex-col max-[820px]:items-start">
        <div>
          <p class="eyebrow">精选信号 / FEATURED</p>
          <h2 class="m-0 text-[30px] font-bold md:text-[40px]">先从一条信号开始。</h2>
        </div>
        <nuxt-link
          class="text-link arrow-hover"
          to="/posts?sort=featured"
        >
          查看全部精选
          <span aria-hidden="true">→</span>
        </nuxt-link>
      </div>
      <div
        v-if="props.isLoading"
        class="flex min-h-[300px] flex-col items-center justify-center gap-[14px]"
        role="status"
      >
        <el-skeleton
          :rows="4"
          animated
        />
      </div>
      <div
        v-else-if="props.loadError"
        class="flex min-h-[300px] flex-col items-center justify-center gap-[14px]"
        role="alert"
      >
        <el-alert
          :title="props.loadError"
          type="error"
          show-icon
        />
        <el-button
          type="primary"
          size="small"
          @click="props.loadHomeData"
        >
          重新连接
        </el-button>
      </div>
      <div
        v-else-if="!props.postsCount"
        class="flex min-h-[300px] flex-col items-center justify-center gap-[14px]"
      >
        <el-empty description="这里还没有公开信号，成为第一个留下文字的人吧。">
          <nuxt-link
            v-slot="{ navigate }"
            to="/write"
            custom
          >
            <el-button
              type="primary"
              size="small"
              @click="navigate"
              >投递第一条信号
            </el-button>
          </nuxt-link>
        </el-empty>
      </div>
      <div
        v-else
        class="featured-grid"
      >
        <nuxt-link
          v-if="props.featuredPost"
          class="featured-post group relative flex min-h-[360px] flex-col justify-end overflow-hidden rounded-xl p-8 text-[#f9fbf6]"
          :to="`/posts/${props.featuredPost.slug}`"
        >
          <img
            :src="props.postCover(props.featuredPost)"
            :alt="props.featuredPost.coverImage?.altText || props.featuredPost.topic.name"
            class="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
          />
          <span class="featured-post__topic relative z-10"># {{ props.featuredPost.topic.name }}</span>
          <h3 class="relative z-10">{{ postDisplayTitle(props.featuredPost) }}</h3>
          <p
            v-if="postDisplayExcerpt(props.featuredPost)"
            class="relative z-10"
          >
            {{ postDisplayExcerpt(props.featuredPost) }}
          </p>
          <span class="featured-post__meta relative z-10">
            {{ props.featuredPost.author.nickname }} · {{ props.formatDate(props.featuredPost.publishedAt) }}
          </span>
        </nuxt-link>
        <div class="supporting-posts">
          <nuxt-link
            v-for="(post, index) in props.supportingPosts"
            :key="post.slug"
            class="supporting-post group arrow-hover"
            :to="`/posts/${post.slug}`"
          >
            <span class="block w-[140px] aspect-[1.55] overflow-hidden rounded-xl max-[560px]:w-[104px]">
              <img
                :src="props.postCover(post, index + 1)"
                :alt="post.coverImage?.altText || post.topic.name"
                class="block size-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                loading="lazy"
              />
            </span>
            <span>
              <small>{{ post.topic.name }} · {{ props.formatDate(post.publishedAt) }}</small>
              <strong>{{ postDisplayTitle(post) }}</strong>
              <em v-if="postDisplayExcerpt(post)">{{ postDisplayExcerpt(post) }}</em>
            </span>
            <span aria-hidden="true">→</span>
          </nuxt-link>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.section-band {
  padding: 76px 0;
  background: #f0f1ec;
}

.section-heading {
  margin-bottom: 32px;
}

.featured-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.06fr) minmax(340px, 0.94fr);
  gap: 30px;
}

.featured-post {
  isolation: isolate;
}

.featured-post::after {
  position: absolute;
  z-index: 0;
  inset: 0;
  background: linear-gradient(180deg, rgba(7, 17, 19, 0.08), rgba(7, 17, 19, 0.82));
  content: '';
  pointer-events: none;
}

.featured-post__topic {
  align-self: flex-start;
  padding: 7px 12px;
  color: #101b1d;
  background: var(--accent);
  font-size: 12px;
  font-weight: 700;
}

.featured-post h3 {
  max-width: 560px;
  margin: 22px 0 10px;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.35;
}

.featured-post p {
  max-width: 560px;
  margin: 0;
  color: #dde7e1;
  font-size: 14px;
  line-height: 1.8;
}

.featured-post__meta {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 22px;
  color: #c9d4ce;
  font-size: 12px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.supporting-posts {
  display: grid;
  gap: 0;
}

.supporting-post {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) 20px;
  align-items: center;
  gap: 20px;
  min-height: 120px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}

.supporting-post small {
  display: block;
  margin-bottom: 6px;
  color: var(--muted);
  font-size: 12px;
}

.supporting-post strong,
.supporting-post em {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
}

.supporting-post strong {
  color: var(--ink);
  font-size: 18px;
  font-style: normal;
  font-weight: 700;
  line-height: 1.45;
  -webkit-line-clamp: 1;
}

.supporting-post em {
  margin-top: 5px;
  color: var(--muted);
  font-size: 13px;
  font-style: normal;
  line-height: 1.55;
  -webkit-line-clamp: 2;
}

.supporting-post > span:last-child {
  color: var(--accent-deep);
  font-weight: 700;
}

@media (max-width: 900px) {
  .featured-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .supporting-post {
    grid-template-columns: 104px minmax(0, 1fr) 16px;
    gap: 14px;
  }
}
</style>
