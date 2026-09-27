<script setup lang="ts">
import type { PublicTopic } from '~/types/post';

const props = defineProps<{
  topics: PublicTopic[];
  isLoading: boolean;
}>();
</script>

<template>
  <section class="topics-section shell-container py-[76px]">
    <div class="section-heading flex items-end justify-between gap-6 max-[820px]:flex-col max-[820px]:items-start">
      <div>
        <p class="eyebrow">星球主题 / TOPICS</p>
        <h2 class="m-0 text-[30px] font-bold md:text-[40px]">每一种好奇，都有自己的轨道。</h2>
      </div>
      <nuxt-link
        class="text-link arrow-hover"
        to="/posts"
      >
        按主题浏览 <span aria-hidden="true">→</span>
      </nuxt-link>
    </div>
    <div
      v-if="props.isLoading"
      class="py-[25px]"
      role="status"
    >
      <el-skeleton
        :rows="2"
        animated
      />
    </div>
    <div
      v-else-if="!props.topics.length"
      class="py-[25px]"
    >
      <el-empty description="主题正在整理中，先去广场看看吧。" />
    </div>
    <div
      v-else
      class="topic-grid"
    >
      <nuxt-link
        v-for="(topic, index) in props.topics"
        :key="topic.slug"
        class="topic-item flex flex-col"
        :to="{ path: '/posts', query: { topic: topic.slug } }"
      >
        <span class="topic-item__icon">{{ index + 1 }}</span>
        <span class="topic-item__name">{{ topic.name }}</span>
        <span class="topic-item__description">{{ topic.description }}</span>
      </nuxt-link>
    </div>
  </section>
</template>

<style scoped lang="scss">
.section-heading {
  margin-bottom: 32px;
}

.topic-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.topic-item {
  min-height: 190px;
  padding: 28px 22px 24px;
  border-right: 1px solid var(--line);
  text-align: center;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.topic-item:last-child {
  border-right: 0;
}

.topic-item:hover {
  background: #fff;
  transform: translateY(-2px);
}

.topic-item__icon {
  display: grid;
  width: 58px;
  height: 58px;
  margin: 0 auto 18px;
  place-items: center;
  border: 1px solid #d7ddd7;
  border-radius: 50%;
  color: var(--accent-deep);
  font-family: 'Source Sans 3', sans-serif;
  font-size: 20px;
  font-weight: 700;
}

.topic-item__name {
  margin-top: auto;
  font-size: 18px;
  font-weight: 700;
}

.topic-item__description {
  margin-top: 9px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.65;
}

@media (max-width: 900px) {
  .topic-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .topic-item:nth-child(2n) {
    border-right: 0;
  }

  .topic-item {
    border-bottom: 1px solid var(--line);
  }
}
</style>
