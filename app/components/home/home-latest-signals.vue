<script setup lang="ts">
import type { PostListItem } from '~/types/post';
import { postDisplayExcerpt, postDisplayTitle } from '~/utils/postDisplay';

const props = defineProps<{
  latestPosts: PostListItem[];
  isLoading: boolean;
  formatDate: (value: string) => string;
}>();
</script>

<template>
  <section class="latest-section section-band section-band--dark">
    <div class="shell-container">
      <div
        class="section-heading section-heading--light flex items-end justify-between gap-6 max-[820px]:flex-col max-[820px]:items-start"
      >
        <div>
          <p class="eyebrow eyebrow--light">最新着陆 / LATEST SIGNALS</p>
          <h2 class="m-0 text-[30px] font-bold md:text-[40px]">刚刚抵达星球的信号。</h2>
        </div>
        <nuxt-link
          class="text-link text-link--light arrow-hover"
          to="/posts?sort=latest"
        >
          查看全部最新信号 <span aria-hidden="true">→</span>
        </nuxt-link>
      </div>
      <div
        v-if="props.isLoading"
        class="latest-list pt-[25px] text-sm text-[#98ada4]"
        role="status"
      >
        <el-skeleton
          :rows="4"
          animated
        />
      </div>
      <div
        v-else-if="!props.latestPosts.length"
        class="latest-list"
      >
        <el-empty description="暂时还没有新信号。" />
      </div>
      <div
        v-else
        class="latest-list"
      >
        <nuxt-link
          v-for="post in props.latestPosts"
          :key="post.slug"
          class="latest-item"
          :to="`/posts/${post.slug}`"
        >
          <span class="latest-item__date">{{ props.formatDate(post.publishedAt) }}</span>
          <strong class="text-ellipsis">{{ postDisplayTitle(post) }}</strong>
          <span class="latest-item__excerpt text-ellipsis">{{ postDisplayExcerpt(post) }}</span>
          <span class="latest-item__topic"># {{ post.topic.name }}</span>
        </nuxt-link>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.eyebrow--light {
  color: #dce8df;
}

.text-link--light {
  color: #eff6f0;
}

.section-band {
  padding: 76px 0;
}

.section-band--dark {
  color: #eff7f1;
  background: var(--night);
}

.section-heading {
  margin-bottom: 32px;
}

.section-heading--light h2 {
  color: #eff7f1;
}

.latest-list {
  border-top: 1px solid rgba(214, 228, 219, 0.22);
}

.latest-item {
  display: grid;
  grid-template-columns: 110px minmax(170px, 0.8fr) minmax(0, 1fr) 150px;
  align-items: center;
  gap: 20px;
  min-height: 64px;
  border-bottom: 1px solid rgba(214, 228, 219, 0.18);
  color: #e9f0ea;
}

.latest-item:hover {
  color: var(--accent);
}

.latest-item__date,
.latest-item__topic,
.latest-item__excerpt {
  color: #8fa49b;
  font-size: 12px;
}

.latest-item strong {
  font-size: 15px;
  font-weight: 700;
}

@media (max-width: 900px) {
  .latest-item {
    grid-template-columns: 86px minmax(0, 1fr) 110px;
  }

  .latest-item__excerpt {
    display: none;
  }
}

@media (max-width: 560px) {
  .latest-item {
    grid-template-columns: 74px minmax(0, 1fr);
  }

  .latest-item__topic {
    display: none;
  }
}
</style>
