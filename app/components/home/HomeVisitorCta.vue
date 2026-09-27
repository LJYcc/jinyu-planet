<script setup lang="ts">
defineProps<{
  visitorName: string;
}>();
</script>

<template>
  <section class="bottle-section">
    <div class="shell-container bottle-card grid items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
      <div>
        <h2 class="m-0 mb-[10px] text-[28px] font-bold md:text-[34px]">你好，{{ visitorName }}。</h2>
        <p class="m-0 text-[15px] leading-[1.8] text-[var(--muted)]">
          在这里，任何一个小小的想法，都值得被温柔对待。现在就投递你的第一条信号吧。
        </p>
      </div>
      <span
        class="bottle-card__line"
        aria-hidden="true"
      ></span>
      <div class="flex justify-start md:justify-center">
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
            <span aria-hidden="true">→ </span>
          </el-button>
        </nuxt-link>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.bottle-section {
  padding: 48px 0;
  background: #faf8ec;
}

.bottle-card__line {
  display: block;
  width: 1px;
  height: 74px;
  background: #c9d0ca;
}

@media (max-width: 900px) {
  .bottle-card__line {
    display: none;
  }
}
</style>
