<script setup lang="ts">
import HomeFeaturedSignals from '~/components/home/home-featured-signals.vue';
import HomeHero from '~/components/home/home-hero.vue';
import HomeIntro from '~/components/home/home-intro.vue';
import HomeLatestSignals from '~/components/home/home-latest-signals.vue';
import HomeTopics from '~/components/home/home-topics.vue';
import HomeVisitorCta from '~/components/home/home-visitor-cta.vue';

useSeoMeta({
  title: '金鱼星球 | Goldfish Planet',
  description: '把想说的话，投进一颗小小的星球。'
});

const {
  posts,
  topics,
  isLoading,
  loadError,
  visitorName,
  featuredPost,
  supportingPosts,
  latestPosts,
  formatDate,
  postCover,
  loadHomeData
} = useHomeData();
</script>

<template>
  <div>
    <!-- 首页首屏：品牌定位、主文案和两个核心入口 -->
    <home-hero />

    <!-- 星球自述：站点介绍和视觉素材 -->
    <home-intro />

    <!-- 精选信号：一条主推荐、三条次推荐和加载/错误/空状态 -->
    <home-featured-signals
      :featured-post="featuredPost"
      :supporting-posts="supportingPosts"
      :posts-count="posts.length"
      :is-loading="isLoading"
      :load-error="loadError"
      :format-date="formatDate"
      :post-cover="postCover"
      :load-home-data="loadHomeData"
    />

    <!-- 星球主题：主题列表和主题筛选入口 -->
    <home-topics
      :topics="topics"
      :is-loading="isLoading"
    />

    <!-- 最新着陆：按时间展示最近抵达的公开信号 -->
    <home-latest-signals
      :latest-posts="latestPosts"
      :is-loading="isLoading"
      :format-date="formatDate"
    />

    <!-- 漂流瓶 CTA：用当前匿名昵称引导访客投递信号 -->
    <home-visitor-cta :visitor-name="visitorName" />
  </div>
</template>
