<script setup lang="ts">
import introImage from '~/assets/images/bg-write-desk-dawn-hero.png';
</script>

<template>
  <section
    class="intro-section shell-container grid gap-10 py-[72px] md:grid-cols-[minmax(0,.95fr)_minmax(320px,1.2fr)]"
  >
    <div class="intro-section__copy">
      <p class="eyebrow">星球自述 / ABOUT US</p>
      <h2 class="my-[18px] max-w-[600px] text-[34px] font-bold leading-[1.22] md:text-[46px]">
        一个可以短暂停靠的数字星球
      </h2>
      <p class="m-0 mb-[26px] max-w-[560px] text-[15px] leading-[2] text-[var(--muted)]">
        在这里，任何微小的想法都值得被倾听。金鱼星球不是人设广场，也不要求完美答案，它只负责安静地接住那些细小而真实的光。
      </p>
      <p class="intro-section__en">A smaller brighter place for a brighter you.</p>
    </div>
    <figure class="intro-section__figure">
      <img
        :src="introImage"
        class="rounded-xl"
        alt="清晨书桌、山景与打开的笔记本"
      />
      <figcaption>生活中微小的时刻，也值得被看见。</figcaption>
    </figure>
  </section>
</template>

<style scoped lang="scss">
.intro-section {
  border-bottom: 1px solid var(--line);
}

.intro-section__en {
  margin-top: 28px;
  color: #8b9690;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 1.8;
  text-transform: uppercase;
}

.intro-section__figure {
  position: relative;
  margin: 0;
}

.intro-section__figure img {
  display: block;
  width: 100%;
  aspect-ratio: 1.85;
  object-fit: cover;
}

.intro-section__figure figcaption {
  position: absolute;
  top: 28px;
  left: 50%;
  color: rgba(26, 30, 29, 0.7);
  font-size: 18px;
  transform: translateX(-50%);
  white-space: nowrap;
}

@media (max-width: 560px) {
  .intro-section__figure figcaption {
    top: 18px;
    font-size: 14px;
  }
}
</style>
