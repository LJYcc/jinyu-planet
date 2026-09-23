<script setup lang="ts">
import type { PostListItem, PostsPage, PublicTopic } from '~/types/post';

useSeoMeta({
  title: '金鱼星球 | Goldfish Planet',
  description: '把想说的话，投进一颗小小的星球。'
});

const posts = ref<PostListItem[]>([]);
const topics = ref<PublicTopic[]>([]);
const isLoading = ref(true);
const loadError = ref('');
const visitorName = ref('路过的星球居民');
const { bootstrap } = useVisitor();

const featuredPost = computed(() => posts.value[0] ?? null);
const supportingPosts = computed(() => posts.value.slice(1, 4));
const latestPosts = computed(() => posts.value.slice(0, 6));

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(value));
}

async function loadHomeData() {
  isLoading.value = true;
  loadError.value = '';
  try {
    const [postPage, topicResponse] = await Promise.all([
      $fetch<PostsPage>('/api/posts', { query: { page: 1, pageSize: 7 } }),
      $fetch<{ topics: PublicTopic[] }>('/api/topics')
    ]);
    posts.value = postPage.items;
    topics.value = topicResponse.topics;
  } catch {
    loadError.value = '暂时没有连上星球信号，请稍后再试。';
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  await Promise.allSettled([
    loadHomeData(),
    bootstrap().then(visitor => {
      if (visitor?.nickname) visitorName.value = visitor.nickname;
    })
  ]);
});
</script>

<template>
  <div class="home-page">
    <section class="home-hero">
      <div class="home-hero__stars" aria-hidden="true"></div>
      <div class="shell-container home-hero__content relative z-[1] flex flex-1 flex-col justify-center pt-[74px]">
        <p class="eyebrow eyebrow--light">OPEN SPACE FOR SMALL THOUGHTS</p>
        <h1 class="m-0 max-w-[740px] text-[clamp(48px,8vw,106px)] font-bold leading-[.98] tracking-[-.02em]">
          金鱼星球<em>GOLDFISH PLANET</em>
        </h1>
        <p class="home-hero__lead mt-[35px] mb-[7px] text-[clamp(18px,2.4vw,27px)] text-[#f2f5ee]">
          把想说的话，投进一颗小小的星球。
        </p>
        <p class="home-hero__description m-0 max-w-[480px] text-sm leading-[1.9] text-[#aebdb7]">
          这里收集没有标准答案的想法、在生活里捡到的片段，以及愿意被陌生人读到的一点真心。
        </p>
        <div class="home-hero__actions mt-[31px] flex items-center gap-[25px]">
          <NuxtLink to="/posts" custom v-slot="{ navigate }">
            <ElButton type="primary" size="large" @click="navigate"
              >进入星球广场 <span aria-hidden="true">↗</span></ElButton
            >
          </NuxtLink>
          <NuxtLink class="text-link text-link--light" to="/write"
            >投递新信号 <span aria-hidden="true">→</span></NuxtLink
          >
        </div>
      </div>
      <div class="shell-container home-hero__footer relative z-[1] flex justify-end pb-[26px]">
        <span>SCROLL TO EXPLORE ↓</span>
      </div>
    </section>

    <section
      class="intro-section shell-container grid gap-9 pt-[112px] pb-[126px] md:grid-cols-[minmax(120px,.7fr)_minmax(0,1.55fr)_minmax(150px,.75fr)]"
    >
      <div class="section-kicker">01 <span>星球自述</span></div>
      <div class="intro-section__copy">
        <h2 class="my-[19px] text-[clamp(27px,4vw,46px)] font-medium leading-[1.2] tracking-[-.03em]">
          一个可以短暂停靠的<br /><span>数字星球。</span>
        </h2>
        <p class="m-0 mb-[26px] max-w-[530px] text-[15px] leading-[2] text-[var(--muted)]">
          金鱼星球由站长发起，但不只记录一个人的生活。你可以安静看看，也可以留下自己的坐标。这里没有登录门槛，也不急着给想法下结论。
        </p>
        <NuxtLink class="text-link" to="/about">认识这颗星球 <span aria-hidden="true">→</span></NuxtLink>
      </div>
      <div class="intro-section__note">
        <span class="note-line"></span>
        <p>A small planet for<br />thoughts worth<br />leaving behind.</p>
      </div>
    </section>

    <section class="signals-section section-band">
      <div class="shell-container">
        <div class="section-heading">
          <div>
            <div class="section-kicker">02 <span>精选信号</span></div>
            <h2 class="my-[19px] mb-0 text-[clamp(27px,4vw,46px)] font-medium leading-[1.2] tracking-[-.03em]">
              先从一条信号开始。
            </h2>
          </div>
          <NuxtLink class="text-link" to="/posts">查看全部 <span aria-hidden="true">↗</span></NuxtLink>
        </div>
        <div v-if="isLoading" class="flex min-h-[220px] flex-col items-center justify-center gap-[14px]" role="status">
          <ElSkeleton :rows="3" animated />
        </div>
        <div
          v-else-if="loadError"
          class="flex min-h-[220px] flex-col items-center justify-center gap-[14px]"
          role="alert"
        >
          <ElAlert :title="loadError" type="error" show-icon />
          <ElButton type="primary" size="small" @click="loadHomeData">重新连接</ElButton>
        </div>
        <div v-else-if="!posts.length" class="flex min-h-[220px] flex-col items-center justify-center gap-[14px]">
          <ElEmpty description="这里还没有公开信号，成为第一个留下文字的人吧。">
            <NuxtLink to="/write" custom v-slot="{ navigate }">
              <ElButton type="primary" size="small" @click="navigate">投递第一条信号</ElButton>
            </NuxtLink>
          </ElEmpty>
        </div>
        <div v-else class="featured-grid">
          <NuxtLink v-if="featuredPost" class="featured-post" :to="`/posts/${featuredPost.slug}`">
            <span class="featured-post__index">精选 / 01</span
            ><span class="featured-post__topic">{{ featuredPost.topic.name }}</span>
            <h3>{{ featuredPost.title || featuredPost.excerpt }}</h3>
            <p>{{ featuredPost.excerpt }}</p>
            <span class="featured-post__meta"
              >{{ featuredPost.author.nickname }} · {{ formatDate(featuredPost.publishedAt) }}</span
            ><span class="featured-post__arrow" aria-hidden="true">↗</span>
          </NuxtLink>
          <div class="supporting-posts">
            <NuxtLink
              v-for="(post, index) in supportingPosts"
              :key="post.slug"
              class="supporting-post"
              :to="`/posts/${post.slug}`"
            >
              <span class="supporting-post__index">0{{ index + 2 }}</span
              ><span
                ><small>{{ post.topic.name }} · {{ formatDate(post.publishedAt) }}</small
                ><strong>{{ post.title || post.excerpt }}</strong></span
              ><span aria-hidden="true">→</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section class="topics-section shell-container pt-[108px] pb-[116px]">
      <div class="section-heading">
        <div>
          <div class="section-kicker">03 <span>星球主题</span></div>
          <h2 class="my-[19px] mb-0 text-[clamp(27px,4vw,46px)] font-medium leading-[1.2] tracking-[-.03em]">
            每一种好奇，都有自己的轨道。
          </h2>
        </div>
      </div>
      <div v-if="isLoading" class="py-[25px]" role="status"><ElSkeleton :rows="2" animated /></div>
      <div v-else-if="!topics.length" class="py-[25px]"><ElEmpty description="主题正在整理中，先去广场看看吧。" /></div>
      <div v-else class="topic-grid">
        <NuxtLink
          v-for="(topic, index) in topics"
          :key="topic.slug"
          class="topic-item"
          :to="{ path: '/posts', query: { topic: topic.slug } }"
        >
          <span class="topic-item__number">0{{ index + 1 }}</span
          ><span class="topic-item__name">{{ topic.name }}</span
          ><span class="topic-item__description">{{ topic.description }}</span
          ><span class="topic-item__arrow" aria-hidden="true">↗</span>
        </NuxtLink>
      </div>
    </section>

    <section class="latest-section section-band section-band--dark">
      <div class="shell-container">
        <div class="section-heading section-heading--light">
          <div>
            <div class="section-kicker section-kicker--light">04 <span>最新着陆</span></div>
            <h2 class="my-[19px] mb-0 text-[clamp(27px,4vw,46px)] font-medium leading-[1.2] tracking-[-.03em]">
              刚刚抵达星球的信号。
            </h2>
          </div>
          <NuxtLink class="text-link text-link--light" to="/posts">进入广场 <span aria-hidden="true">↗</span></NuxtLink>
        </div>
        <div v-if="isLoading" class="latest-list pt-[25px] text-sm text-[#98ada4]" role="status">
          <ElSkeleton :rows="4" animated />
        </div>
        <div v-else-if="!latestPosts.length" class="latest-list"><ElEmpty description="暂时还没有新信号。" /></div>
        <div v-else class="latest-list">
          <NuxtLink v-for="post in latestPosts" :key="post.slug" class="latest-item" :to="`/posts/${post.slug}`"
            ><span class="latest-item__date">{{ formatDate(post.publishedAt) }}</span
            ><span class="latest-item__topic">{{ post.topic.name }}</span
            ><strong class="text-ellipsis">{{ post.title || post.excerpt }}</strong
            ><span class="latest-item__arrow" aria-hidden="true">↗</span></NuxtLink
          >
        </div>
      </div>
    </section>

    <section class="bottle-section shell-container">
      <div class="bottle-card">
        <div>
          <p class="eyebrow">漂流瓶提示 / MESSAGE IN A BOTTLE</p>
          <h2 class="mb-[14px] text-[clamp(24px,4vw,38px)] font-medium leading-[1.2]">你好，{{ visitorName }}。</h2>
          <p>如果今天有一句话想被陌生人读到，给这颗星球投递一条信号吧。</p>
        </div>
        <NuxtLink to="/write" custom v-slot="{ navigate }">
          <ElButton type="primary" size="large" @click="navigate"
            >写下第一条信号 <span aria-hidden="true">↗</span></ElButton
          >
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.eyebrow--light {
  color: #c4d0cc;
}

.section-kicker {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--accent-deep);
  font:
    700 11px/1.2 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-kicker span {
  color: var(--muted);
  font-family: 'Noto Sans SC', sans-serif;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}

.section-kicker--light,
.section-kicker--light span {
  color: #d9e5df;
}

.section-kicker--light span {
  color: #91a7a0;
}

.text-link--light {
  color: #eff6f0;
}

.home-hero {
  position: relative;
  display: flex;
  min-height: min(780px, 90vh);
  flex-direction: column;
  overflow: hidden;
  color: #f7faf7;
  background: var(--night);
}

.home-hero__stars {
  position: absolute;
  inset: 0;
  opacity: 0.35;
}

.home-hero__stars::before {
  position: absolute;
  top: 18%;
  left: 17%;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: #dce8dd;
  box-shadow:
    260px 50px #dce8dd,
    520px -24px #dce8dd,
    740px 190px #dce8dd,
    930px 82px #dce8dd,
    1070px 340px #dce8dd,
    380px 360px #dce8dd,
    80px 420px #dce8dd,
    690px 480px #dce8dd;
  content: '';
}

.home-hero::after {
  position: absolute;
  right: -12%;
  bottom: -40%;
  left: -12%;
  height: 70%;
  border-top: 1px solid rgba(229, 199, 95, 0.24);
  border-radius: 50%;
  box-shadow:
    0 -22px 0 rgba(229, 199, 95, 0.05),
    0 -46px 0 rgba(229, 199, 95, 0.04);
  content: '';
  transform: rotate(-4deg);
}

.home-hero h1 {
  max-width: 740px;
  margin: 0;
  font-size: clamp(48px, 8vw, 106px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 0.98;
}

.home-hero h1 em {
  display: block;
  margin-top: 0.16em;
  color: #b9c5c0;
  font-family: 'Source Sans 3', sans-serif;
  font-size: 0.36em;
  font-style: normal;
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: 0.2em;
}

.home-hero__footer {
  color: #91a19b;
  font:
    10px/1 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  letter-spacing: 0.12em;
}

.intro-section__copy h2 span {
  color: var(--accent-deep);
}

.intro-section__note {
  align-self: end;
  color: var(--muted);
  font:
    12px/1.75 ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}

.note-line {
  display: block;
  width: 34px;
  height: 1px;
  margin-bottom: 13px;
  background: var(--accent-deep);
}

.section-band {
  padding: 100px 0;
  background: #ebece8;
}

.section-band--dark {
  color: #eff7f1;
  background: var(--night-soft);
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 42px;
}

.section-heading--light h2 {
  color: #eff7f1;
}

.featured-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 2px;
  background: #cbd0cb;
}

.featured-post {
  position: relative;
  display: flex;
  min-height: 390px;
  flex-direction: column;
  justify-content: flex-end;
  padding: 36px;
  color: #f6f9f4;
  background: var(--night);
  overflow: hidden;
}

.featured-post::before {
  position: absolute;
  top: 22%;
  right: -10%;
  width: 65%;
  height: 65%;
  border: 1px solid rgba(229, 199, 95, 0.35);
  border-radius: 50%;
  content: '';
  transform: rotate(-24deg);
}

.featured-post > * {
  position: relative;
  z-index: 1;
}

.featured-post__index {
  position: absolute;
  top: 28px;
  left: 36px;
  color: var(--accent);
  font:
    10px ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
  letter-spacing: 0.12em;
}

.featured-post__topic {
  color: #aabdb6;
  font-size: 12px;
}

.featured-post h3 {
  max-width: 540px;
  margin: 14px 0 10px;
  font-size: clamp(24px, 3vw, 38px);
  font-weight: 500;
  line-height: 1.3;
}

.featured-post p {
  max-width: 530px;
  margin: 0;
  color: #b7c7c0;
  font-size: 13px;
  line-height: 1.75;
}

.featured-post__meta {
  margin-top: 28px;
  color: #93a59e;
  font:
    11px ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}

.featured-post__arrow {
  position: absolute;
  right: 34px;
  bottom: 28px;
  color: var(--accent);
  font-size: 24px;
}

.supporting-posts {
  background: #f7f8f4;
}

.supporting-post {
  display: grid;
  grid-template-columns: 42px 1fr 20px;
  align-items: center;
  gap: 12px;
  min-height: 130px;
  padding: 20px 25px;
  border-bottom: 1px solid var(--line);
}

.supporting-post:last-child {
  border-bottom: 0;
}

.supporting-post:hover {
  background: #fff;
}

.supporting-post__index {
  color: #b0b8b1;
  font:
    11px ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}

.supporting-post small {
  display: block;
  margin-bottom: 8px;
  color: var(--muted);
  font-size: 11px;
}

.supporting-post strong {
  display: block;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
}

.supporting-post > span:last-child {
  color: var(--accent-deep);
  font-size: 18px;
}

.topic-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border-top: 1px solid var(--line);
}

.topic-item {
  display: flex;
  min-height: 200px;
  flex-direction: column;
  padding: 22px 20px 24px 0;
  border-right: 1px solid var(--line);
  transition:
    background 0.2s,
    padding 0.2s;
}

.topic-item + .topic-item {
  padding-left: 20px;
}

.topic-item:last-child {
  border-right: 0;
}

.topic-item:hover {
  padding-top: 28px;
  background: #fff;
}

.topic-item__number {
  color: var(--accent-deep);
  font:
    11px ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}

.topic-item__name {
  margin-top: auto;
  font-size: 18px;
  font-weight: 700;
}

.topic-item__description {
  margin-top: 9px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}

.topic-item__arrow {
  align-self: end;
  margin-top: 18px;
  color: var(--accent-deep);
  font-size: 17px;
}

.latest-section {
  padding-bottom: 108px;
}

.latest-list {
  border-top: 1px solid rgba(214, 228, 219, 0.22);
}

.latest-item {
  display: grid;
  grid-template-columns: 100px 150px 1fr 25px;
  align-items: center;
  gap: 18px;
  min-height: 72px;
  border-bottom: 1px solid rgba(214, 228, 219, 0.18);
  color: #e9f0ea;
}

.latest-item:hover {
  color: var(--accent);
}

.latest-item__date,
.latest-item__topic {
  color: #8fa49b;
  font:
    11px ui-monospace,
    SFMono-Regular,
    Consolas,
    monospace;
}

.latest-item strong {
  font-size: 15px;
  font-weight: 500;
}

.latest-item__arrow {
  color: var(--accent);
  text-align: right;
}

.bottle-section {
  padding-top: 96px;
  padding-bottom: 112px;
}

.bottle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  padding: 50px 58px;
  border: 1px solid #c9d0ca;
  background: #e8ece6;
}

.bottle-card p:last-child {
  max-width: 510px;
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.8;
}

@media (max-width: 820px) {
  .home-hero {
    min-height: 680px;
  }

  .home-hero__content {
    padding-top: 95px;
  }

  .home-hero h1 {
    font-size: clamp(45px, 13vw, 76px);
  }

  .intro-section {
    grid-template-columns: 1fr;
    gap: 24px;
    padding-top: 78px;
    padding-bottom: 82px;
  }

  .intro-section__note {
    display: none;
  }

  .section-band {
    padding: 72px 0;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 28px;
  }

  .featured-grid {
    grid-template-columns: 1fr;
  }

  .featured-post {
    min-height: 350px;
  }

  .topics-section {
    padding-top: 78px;
    padding-bottom: 82px;
  }

  .topic-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .topic-item {
    min-height: 170px;
    border-bottom: 1px solid var(--line);
  }

  .topic-item:nth-child(2n) {
    border-right: 0;
  }

  .latest-item {
    grid-template-columns: 76px 1fr 20px;
    gap: 12px;
  }

  .latest-item__topic {
    display: none;
  }

  .bottle-section {
    padding-top: 70px;
    padding-bottom: 80px;
  }

  .bottle-card {
    align-items: flex-start;
    flex-direction: column;
    gap: 25px;
    padding: 34px 26px;
  }
}

@media (max-width: 420px) {
  .home-hero__actions {
    align-items: flex-start;
    flex-direction: column;
    gap: 18px;
  }

  .home-hero__footer {
    font-size: 9px;
  }

  .featured-post {
    padding: 30px 24px;
  }

  .featured-post__index {
    left: 24px;
  }

  .supporting-post {
    padding: 17px 15px;
  }

  .latest-item strong {
    font-size: 13px;
  }
}
</style>
