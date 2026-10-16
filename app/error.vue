<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();
const statusCode = computed(() => props.error.statusCode || 500);
const isNotFound = computed(() => statusCode.value === 404);

useSeoMeta({
  title: computed(() => (isNotFound.value ? '页面未找到 | 金鱼星球' : '服务暂时不可用 | 金鱼星球')),
  description: computed(() =>
    isNotFound.value ? '你访问的页面不存在或已离开轨道。' : '金鱼星球暂时无法完成这次请求。'
  )
});

async function returnHome() {
  await clearError({ redirect: '/' });
}
</script>

<template>
  <main class="error-page flex min-h-screen items-center justify-center px-6 py-16">
    <section class="error-page__card max-w-[580px] text-center">
      <p class="mb-3 text-[13px] font-bold tracking-[0.16em] text-[var(--accent-deep)]">
        {{ statusCode }} · SIGNAL LOST
      </p>
      <h1 class="m-0 text-[clamp(36px,8vw,68px)] font-bold leading-[1.1] text-[var(--ink)]">
        {{ isNotFound ? '这条轨道还没有信号' : '星球暂时收不到信号' }}
      </h1>
      <p class="mx-auto mt-6 mb-8 max-w-[440px] text-[16px] leading-8 text-[var(--muted)]">
        {{
          isNotFound
            ? '你访问的页面可能不存在，或者已经换了一个坐标。'
            : '请稍后重试；如果问题持续出现，欢迎回到首页继续探索。'
        }}
      </p>
      <el-button
        type="primary"
        size="large"
        @click="returnHome"
      >
        返回金鱼星球首页
      </el-button>
    </section>
  </main>
</template>

<style scoped lang="scss">
.error-page {
  background: radial-gradient(circle at 50% 5%, rgba(224, 181, 73, 0.2), transparent 32%), #f7f8f3;
}

.error-page__card {
  animation: arrive 0.45s ease-out both;
}

@keyframes arrive {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
