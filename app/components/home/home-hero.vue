<script setup lang="ts">
import homeHeroBg from '~/assets/images/bg-home-night-mountain-hero.png';
</script>

<template>
  <section
    class="home-hero flex flex-col"
    :style="{
      backgroundImage: `linear-gradient(90deg, rgba(5, 15, 18, 0.68), rgba(5, 15, 18, 0.2)), url(${homeHeroBg})`
    }"
  >
    <div class="shell-container home-hero__content relative z-[1] flex flex-1 flex-col justify-center pt-[78px]">
      <p class="eyebrow eyebrow--light">OPEN SPACE FOR SMALL THOUGHTS</p>
      <h1 class="planet-hero-title m-0 max-w-[720px] text-[54px] font-bold leading-[1.02] md:text-[92px]">
        金鱼星球
        <em>GOLDFISH PLANET</em>
      </h1>
      <p class="home-hero__lead mt-[24px] mb-[7px] text-[20px] font-semibold text-[#f5f8f0] md:text-[25px]">
        把想说的话，投进一颗小小的星球。
      </p>
      <p class="home-hero__description m-0 max-w-[500px] text-[15px] leading-[1.9] text-[#d6e0da]">
        这里收集没有标准答案的想法、在生活里捡到的片段，以及愿意被陌生人读到的一点真心。
      </p>
      <div class="home-hero__actions mt-[30px] flex flex-wrap items-center gap-[18px]">
        <nuxt-link
          v-slot="{ navigate }"
          to="/posts"
          custom
        >
          <el-button
            type="primary"
            size="large"
            class="arrow-hover"
            @click="navigate"
          >
            进入星球广场
            <span aria-hidden="true">→</span>
          </el-button>
        </nuxt-link>
        <nuxt-link
          v-slot="{ navigate }"
          to="/write"
          custom
        >
          <el-button
            class="home-hero__ghost"
            size="large"
            @click="navigate"
          >
            投递新信号
          </el-button>
        </nuxt-link>
      </div>
    </div>
    <div class="shell-container home-hero__note relative z-[1] pb-[34px] text-right">
      每一个小小的想法，都是一颗发光的星。
    </div>
  </section>
</template>

<style scoped lang="scss">
.eyebrow--light {
  color: #dce8df;
}

.home-hero {
  position: relative;
  min-height: 720px;
  overflow: hidden;
  color: #f7faf7;
  background-color: var(--night);
  background-position: center bottom;
  background-size: cover;
}

.home-hero::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 15, 18, 0.08), rgba(5, 15, 18, 0.48));
  content: '';
}

.home-hero h1 em {
  display: block;
  margin-top: 10px;
  color: #d5ded8;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 24px;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.26em;
}

.home-hero__ghost {
  --el-button-bg-color: rgba(8, 18, 20, 0.35);
  --el-button-border-color: rgba(245, 248, 240, 0.82);
  --el-button-text-color: #f7faf7;
  --el-button-hover-bg-color: rgba(245, 248, 240, 0.12);
  --el-button-hover-border-color: #fff;
  --el-button-hover-text-color: #fff;
}

.home-hero__note {
  color: rgba(248, 251, 248, 0.86);
  font-size: 20px;
  line-height: 1.8;
}

@media (max-width: 900px) {
  .home-hero {
    min-height: 640px;
  }

  .home-hero h1 {
    font-size: 48px;
  }

  .home-hero h1 em {
    font-size: 17px;
  }
}

@media (max-width: 560px) {
  .home-hero__content {
    padding-top: 100px;
  }
}
</style>
