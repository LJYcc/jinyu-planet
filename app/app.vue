<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import '~/assets/css/main.css';
import '~/assets/css/responsive.css';

useHead({
  link: [{ rel: 'icon', href: '/favicon.ico?v=2', type: 'image/x-icon' }]
});
</script>
