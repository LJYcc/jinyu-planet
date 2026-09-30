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
</script>
