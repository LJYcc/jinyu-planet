<script setup lang="ts">
import { ArrowRight, Clock } from '@element-plus/icons-vue';
import lakeCover from '~/assets/images/post-cover-lakeside-cabin-night.png';
import deskCover from '~/assets/images/post-cover-writing-desk-dawn.png';
import type { PostListItem } from '~/types/post';
import { postDisplayExcerpt, postDisplayTitle } from '~/utils/postDisplay';

defineProps<{ posts: PostListItem[] }>();

function formatDate(value: string) {
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('.');
}

function postCover(post: PostListItem, index: number) {
  return post.coverImage?.url ?? (index % 2 === 0 ? lakeCover : deskCover);
}
</script>

<template>
  <div class="post-list">
    <nuxt-link
      v-for="(post, index) in posts"
      :key="post.slug"
      class="post-card"
      :to="`/posts/${post.slug}`"
    >
      <div class="post-card__image">
        <img
          :src="postCover(post, index)"
          :alt="post.coverImage?.altText || post.topic.name"
          loading="lazy"
        />
      </div>
      <div class="post-card__body">
        <h2>{{ postDisplayTitle(post) }}</h2>
        <p v-if="postDisplayExcerpt(post)">{{ postDisplayExcerpt(post) }}</p>
      </div>
      <div class="post-card__meta">
        <span class="post-meta-chip"># {{ post.topic.name }}</span>
        <time :datetime="post.publishedAt">{{ formatDate(post.publishedAt) }}</time>
        <span class="post-card__reading">
          <el-icon><clock /></el-icon>
          {{ post.readingMinutes }} 分钟
        </span>
        <el-icon
          class="post-card__arrow"
          aria-hidden="true"
          ><arrow-right
        /></el-icon>
      </div>
    </nuxt-link>
  </div>
</template>

<style scoped lang="scss">
.post-list {
  display: flex;
  min-height: 390px;
  flex: 1 1 auto;
  flex-direction: column;
}

.post-card {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr) minmax(195px, auto);
  min-height: 78px;
  gap: 18px;
  padding: 12px 0;
  overflow: hidden;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.post-card:hover {
  color: var(--accent-deep);
  transform: none;
}

.post-card__image {
  overflow: hidden;
  width: 132px;
  aspect-ratio: 2.1;
  background: #d8ddd6;
  border-radius: 3px;
}

.post-card__image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.post-card:hover .post-card__image img {
  transform: scale(1.04);
}

.post-card__body {
  min-width: 0;
  padding: 0;
  align-self: center;
}

.post-card h2 {
  margin: 0 0 3px;
  font-size: 16px;
  line-height: 1.45;
  -webkit-line-clamp: 1;
}

.post-card p {
  font-size: 12px;
  line-height: 1.55;
  -webkit-line-clamp: 2;
}

.post-card__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  align-self: center;
  gap: 13px;
  color: var(--muted);
  font-size: 11px;
  white-space: nowrap;
}

.post-meta-chip {
  max-width: 90px;
  overflow: hidden;
  padding: 5px 8px;
  background: #f0f2ef;
  border-radius: 3px;
  text-overflow: ellipsis;
}

.post-card__meta time::before,
.post-card__reading::before {
  margin-right: 13px;
  color: #b2bbb4;
  content: '/';
}

.post-card__reading {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.post-card__reading::before {
  margin-right: 9px;
}

.post-card__arrow {
  margin-left: auto;
  color: var(--ink);
  font-size: 17px;
}

@media (max-width: 900px) {
  .post-card {
    grid-template-columns: 116px minmax(0, 1fr) auto;
    gap: 14px;
  }

  .post-card__image {
    width: 116px;
  }

  .post-card__meta {
    gap: 8px;
  }

  .post-card__meta time,
  .post-card__reading {
    display: none;
  }
}

@media (max-width: 500px) {
  .post-card {
    grid-template-columns: 104px minmax(0, 1fr);
    min-height: 0;
    gap: 12px;
    padding: 12px 0;
  }

  .post-card__image {
    width: 104px;
  }

  .post-card h2 {
    font-size: 15px;
  }

  .post-card p {
    -webkit-line-clamp: 1;
  }

  .post-card__meta {
    grid-column: 2;
    grid-row: 2;
    justify-content: flex-start;
  }

  .post-card__arrow {
    margin-left: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .post-card__image img {
    transition: none;
  }
}
</style>
