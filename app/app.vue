<template>
  <nuxt-layout>
    <nuxt-page />
  </nuxt-layout>
</template>

<script setup lang="ts">
import '~/assets/css/main.css';
import '~/assets/css/responsive.css';
import 'katex/dist/katex.min.css';

useHead({
  link: [{ rel: 'icon', href: '/favicon-goldfish-planet-tech.ico?v=1', type: 'image/x-icon' }]
});

useSeoMeta({
  ogTitle: '金鱼星球 | Goldfish Planet',
  ogDescription: '把想说的话，投进一颗小小的星球。',
  ogSiteName: '金鱼星球',
  ogType: 'website',
  twitterCard: 'summary'
});
</script>
