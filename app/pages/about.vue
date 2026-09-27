<script setup lang="ts">
import { ChatDotRound, Collection, MagicStick, Sunny } from '@element-plus/icons-vue';
import aboutHeroBg from '~/assets/images/bg-about-orbit-mountain-hero.png';
import ctaBg from '~/assets/images/bg-night-mountain-stars.png';

useSeoMeta({ title: '关于星球 | 金鱼星球', description: '认识金鱼星球，以及为什么这里允许路过。' });

const storyItems = [
  { time: '2024.01', title: '一个想法的开始', text: '我们开始构想金鱼星球，希望让更多普通的声音被听见。' },
  { time: '2024.06', title: '第一个版本上线', text: '从几个人的想法，到第一条信号的诞生。' },
  { time: '2024.12', title: '遇见了更多有趣的你', text: '越来越多温暖的想法，汇聚成这颗小小的星球。' },
  { time: '2025.', title: '继续前行', text: '让金鱼星球成为更多人可以短暂停靠的地方。' }
];

const welcomeItems = [
  { icon: Sunny, title: '生活里的小发现', text: '无论是一段风景、一本书、一道美食，还是日常中忽然闪过的念头。' },
  { icon: ChatDotRound, title: '友善的交流', text: '尊重不同的观点，温柔地对待彼此，让对话成为善意的连接。' },
  {
    icon: MagicStick,
    title: '没有标准答案的想法',
    text: '未完成的思考、天马行空的脑洞、看似不切实际的想象，都很欢迎。'
  },
  {
    icon: Collection,
    title: '任何值得被读到的真心',
    text: '开心的、失落的、困惑的、勇敢的，只要是真诚的，都值得在这里留下一点光。'
  }
];
</script>

<template>
  <div class="about-page">
    <section
      class="about-hero page-photo-hero"
      :style="{
        backgroundImage: `linear-gradient(90deg, rgba(5, 15, 18, 0.72), rgba(5, 15, 18, 0.16)), url(${aboutHeroBg})`
      }"
    >
      <div class="shell-container about-hero__inner flex h-full min-h-0 flex-col justify-center pt-[82px]">
        <p class="eyebrow eyebrow--light">关于星球</p>
        <h1 class="m-0 max-w-[920px] text-[46px] font-bold leading-[1.18] md:text-[70px]">
          一个可以短暂停靠的数字星球
        </h1>
        <p class="mt-[24px] mb-0 max-w-[650px] text-[17px] font-semibold leading-[1.9] text-[#f6f8f1] md:text-[20px]">
          在这里，任何微小的想法都值得被倾听。这是一个属于普通人的星球，收集全世界那些细小而真实的光。
        </p>
      </div>
    </section>

    <section
      class="about-content shell-container grid gap-12 py-[70px] lg:grid-cols-[minmax(0,1.02fr)_minmax(330px,.98fr)]"
    >
      <div class="about-story">
        <div class="about-section-title">
          <h2>我们的故事</h2>
        </div>
        <p class="about-story__intro">
          金鱼星球诞生于一个很简单的想法：在快节奏的世界里，每个人都需要一个可以安心表达的角落。我们希望创建一个温柔、友善、匿名的社区，让人们可以自由地分享想法、情绪和生活中的小小发现。
        </p>
        <ol class="story-timeline">
          <li
            v-for="item in storyItems"
            :key="item.time"
          >
            <time>{{ item.time }}</time>
            <span>
              <strong>{{ item.title }}</strong>
              <em>{{ item.text }}</em>
            </span>
          </li>
        </ol>
      </div>

      <div class="about-welcome">
        <div class="about-section-title">
          <h2>这里欢迎什么</h2>
        </div>
        <div class="welcome-list">
          <article
            v-for="item in welcomeItems"
            :key="item.title"
            class="welcome-item"
          >
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
            <span>
              <h3>{{ item.title }}</h3>
              <p>{{ item.text }}</p>
            </span>
          </article>
        </div>
      </div>
    </section>

    <section
      class="about-cta"
      :style="{
        backgroundImage: `linear-gradient(180deg, rgba(7, 19, 21, 0.76), rgba(7, 19, 21, 0.9)), url(${ctaBg})`
      }"
    >
      <div class="shell-container about-cta__inner">
        <h2>现在，就投递你的第一条信号吧。</h2>
        <nuxt-link
          v-slot="{ navigate }"
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
  </div>
</template>

<style scoped lang="scss">
.about-page {
  background: #f7f8f3;
}

.eyebrow--light {
  color: #dce8df;
}

.about-hero {
  color: #f7faf7;
  background-color: var(--night);
}

.about-content {
  align-items: start;
}

.about-story {
  padding-right: 48px;
  border-right: 1px solid var(--line);
}

.about-section-title {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 24px;
  margin-bottom: 30px;
}

.about-section-title::after {
  height: 1px;
  background: var(--line);
  content: '';
}

.about-section-title h2 {
  margin: 0;
  color: var(--ink);
  font-size: 28px;
  font-weight: 700;
}

.about-story__intro {
  margin: 0 0 48px;
  color: var(--muted);
  font-size: 16px;
  line-height: 2;
}

.story-timeline {
  display: grid;
  gap: 30px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.story-timeline li {
  display: grid;
  position: relative;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 26px;
}

.story-timeline li::before {
  position: absolute;
  top: 5px;
  left: 0;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--ink);
  content: '';
}

.story-timeline time {
  padding-left: 36px;
  color: #7f8984;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 14px;
  font-weight: 700;
}

.story-timeline strong,
.story-timeline em {
  display: block;
}

.story-timeline strong {
  margin-bottom: 8px;
  color: var(--ink);
  font-size: 18px;
  font-weight: 700;
}

.story-timeline em {
  color: var(--muted);
  font-size: 14px;
  font-style: normal;
  line-height: 1.8;
}

.welcome-list {
  display: grid;
  gap: 0;
}

.welcome-item {
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  gap: 22px;
  padding: 24px 0;
  border-bottom: 1px solid var(--line);
}

.welcome-item:first-child {
  padding-top: 0;
}

.welcome-item :deep(.el-icon) {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 50%;
  color: var(--ink);
  background: #eef0eb;
  font-size: 30px;
}

.welcome-item h3 {
  margin: 0 0 8px;
  color: var(--ink);
  font-size: 20px;
  font-weight: 700;
}

.welcome-item p {
  margin: 0;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.85;
}

.about-cta {
  color: #f7faf7;
  background-position: center bottom;
  background-size: cover;
}

.about-cta__inner {
  display: grid;
  min-height: 220px;
  align-content: center;
  justify-items: center;
  gap: 24px;
  text-align: center;
}

.about-cta h2 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
}

@media (max-width: 1024px) {
  .about-story {
    padding-right: 0;
    border-right: 0;
  }
}

@media (max-width: 560px) {
  .story-timeline li,
  .welcome-item {
    grid-template-columns: 1fr;
  }

  .story-timeline time {
    padding-left: 28px;
  }
}
</style>
