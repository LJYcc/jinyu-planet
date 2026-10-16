<script setup lang="ts">
import { ElMessage } from 'element-plus';
import aboutHeroBg from '~/assets/images/bg-about-orbit-mountain-hero.png';
import builderBg from '~/assets/images/bg-night-mountain-stars.png';

useSeoMeta({ title: '关于星球 | 金鱼星球', description: '认识金鱼星球、当前功能与下一段轨道。' });

const builder = {
  name: '廖瑾宇',
  initials: '廖',
  email: '453036921@qq.com',
  githubUrl: 'https://github.com/LJYcc/jinyu-planet',
  resumeUrl: ''
};
const isAuthorDialogVisible = ref(false);

const contactBuilder = async () => {
  let copied = false;

  try {
    await navigator.clipboard.writeText(builder.email);
    copied = true;
  } catch {
    // Some browsers block clipboard access even after a user click.
  }

  window.location.href = `mailto:${builder.email}`;
  ElMessage.success(
    copied
      ? `已尝试打开邮件客户端，邮箱也已复制：${builder.email}`
      : `已尝试打开邮件客户端，请手动发送至 ${builder.email}`
  );
};

const currentFeatures = [
  { title: '匿名访客与轻量昵称', note: '第一次到访就能开始，不用先创建账号；昵称会在当前浏览器中保留。' },
  { title: '图文信号的完整创作', note: '支持富文本、图片、引用、表格、草稿与发布前预览。' },
  { title: '发现与专注阅读', note: '在星球广场按主题、关键词和精选内容探索；详情页为正文保留安静的阅读空间。' },
  { title: '独立 AI 对话空间', note: '右下角的 AI 助理可进入流式对话与历史会话，陪伴未完成的思考。' }
];

const futureFeatures = [
  {
    title: '新闻信号板块与今日星球简报',
    note: '聚合可信新闻来源，持续更新标题、摘要和原文链接；每天沉淀一份可回看的星球简报。'
  },
  { title: 'AI 数字人主题直播', note: '以“星球电台”的形式定时直播，围绕每期主题播报精选信号、轻量资讯与现场回应。' },
  {
    title: '匿名投稿上墙与直播回放',
    note: '让观众的投稿在直播中被朗读与回应；结束后自动沉淀为时间轴、摘要和可阅读的信号。'
  },
  { title: 'AI 星球晨报与晚报', note: '根据访客关注的主题和阅读内容，生成一份轻量、可选择订阅的今日星球信号。' }
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
      <div class="shell-container about-hero__inner h-full min-h-0 pt-[82px]">
        <div>
          <p class="eyebrow eyebrow--light">ABOUT GOLDFISH PLANET</p>
          <h1 class="planet-hero-title m-0 max-w-[920px] text-[46px] font-bold leading-[1.18] md:text-[70px]">
            一个可以短暂停靠的数字星球
          </h1>
          <p class="mt-[24px] mb-0 max-w-[650px] text-[17px] font-semibold leading-[1.9] text-[#f6f8f1] md:text-[20px]">
            在这里，任何微小的想法都值得被倾听。这是一个属于普通人的星球，收集全世界那些细小而真实的光。
          </p>
        </div>

        <aside class="about-builder-card">
          <p class="about-builder-card__eyebrow">FROM THE BUILDER</p>
          <div class="flex items-center gap-4">
            <span
              class="about-builder-card__avatar"
              aria-hidden="true"
              >{{ builder.initials }}</span
            >
            <span>
              <strong>{{ builder.name }}</strong>
              <small>金鱼星球发起人</small>
            </span>
          </div>
          <p>这个项目由我独立设计和持续开发。也欢迎透过它，认识我对产品与工程实现的理解。</p>
          <div class="about-builder-card__links">
            <button
              v-if="builder.email"
              type="button"
              @click="contactBuilder"
            >
              联系发起人 <span aria-hidden="true">↗</span>
            </button>
          </div>
        </aside>
      </div>
    </section>

    <section class="about-planet-notes">
      <div class="shell-container about-planet-notes__inner">
        <div class="about-planet-notes__intro">
          <div>
            <p class="eyebrow">ABOUT THE PLANET</p>
            <h2>一处可以写下、也可以慢慢读的地方。</h2>
          </div>
          <p>
            有些话不急着成为观点，也不需要被很多人看见。金鱼星球想为这些片段留一个坐标：无需注册，不必完整，写下、投递、被读到就已经足够。
          </p>
        </div>

        <div class="about-planet-notes__groups">
          <div>
            <p class="about-planet-notes__label about-planet-notes__label--current">NOW ON THE PLANET</p>
            <ol class="about-feature-list">
              <li
                v-for="(feature, index) in currentFeatures"
                :key="feature.title"
              >
                <span
                  class="about-feature-list__number"
                  aria-hidden="true"
                  >{{ index + 1 }}</span
                >
                <span class="about-feature-list__copy">
                  <strong>{{ feature.title }}</strong>
                  <small>{{ feature.note }}</small>
                </span>
              </li>
            </ol>
          </div>

          <div>
            <p class="about-planet-notes__label">LATER, ON THE ORBIT</p>
            <ul class="about-roadmap-list">
              <li
                v-for="feature in futureFeatures"
                :key="feature.title"
              >
                <strong>{{ feature.title }}</strong>
                <small>{{ feature.note }}</small>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section
      id="about-builder"
      class="about-builder-section"
      :style="{
        backgroundImage: `linear-gradient(90deg, rgba(7, 19, 21, 0.94), rgba(7, 19, 21, 0.78)), url(${builderBg})`
      }"
    >
      <div class="shell-container about-builder-section__inner">
        <div>
          <p class="eyebrow eyebrow--light">MEET THE BUILDER</p>
          <h2>这颗星球由谁守望？</h2>
          <p>
            我是<strong>{{ builder.name }}</strong
            >，金鱼星球的发起人和开发者。从产品想法、视觉与交互，到前端、服务端和数据设计，都由我持续打磨。如果你对这个项目感兴趣，也欢迎了解更多关于我。
          </p>
        </div>
        <div class="about-builder-section__links">
          <a
            v-if="builder.githubUrl"
            :href="builder.githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            >GitHub / 项目代码 <span aria-hidden="true">↗</span></a
          >
          <a
            v-if="builder.resumeUrl"
            :href="builder.resumeUrl"
            target="_blank"
            rel="noopener noreferrer"
            >查看我的简历 <span aria-hidden="true">↗</span></a
          >
          <button
            type="button"
            @click="isAuthorDialogVisible = true"
          >
            关于作者 <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </section>

    <el-dialog
      v-model="isAuthorDialogVisible"
      class="about-author-dialog"
      width="min(760px, calc(100% - 32px))"
      align-center
      :show-close="false"
    >
      <template #header>
        <div class="about-author-dialog__header">
          <p>ABOUT THE BUILDER</p>
          <button
            type="button"
            aria-label="关闭作者介绍"
            @click="isAuthorDialogVisible = false"
          >
            ×
          </button>
        </div>
      </template>

      <div class="about-author-dialog__content">
        <div class="about-author-dialog__identity">
          <span aria-hidden="true">{{ builder.initials }}</span>
          <div>
            <h2>{{ builder.name }}</h2>
            <p><strong>8 年前端 + Node.js 全栈开发经验</strong></p>
          </div>
        </div>

        <p class="about-author-dialog__lead">
          我是一名关注
          <strong>AI 应用与智能体方向</strong>
          的全栈工程师，擅长把产品想法拆解为清晰的技术方案，再完成前后端实现、测试验证、部署上线与持续迭代。
        </p>

        <div class="about-author-dialog__skills">
          <p>专业技能</p>
          <span
            ><strong>AI 大模型 &amp; 智能体开发：</strong>大模型 API、SSE 流式对话、会话管理、文件解析与 Skill
            技能配置。</span
          >
          <span
            ><strong>Node 全栈开发：</strong>Node.js、Koa / Express、WebSocket、MySQL
            数据建模、接口鉴权与数据聚合。</span
          >
          <span
            ><strong>前端开发：</strong>HTML5、CSS3、JavaScript、TypeScript、Vue、React、Nuxt / Next.js SSR
            与多端开发。</span
          >
          <span
            ><strong>工程化与第三方集成：</strong>组件与设计系统、Vite /
            Webpack、Jest、CI/CD、线上部署与问题排查。</span
          >
        </div>

        <p class="about-author-dialog__advantage-title">个人优势</p>
        <p class="about-author-dialog__advantage">
          具备 <strong>8 年前端与 Node.js 全栈开发经验</strong>，聚焦 AI 应用与智能体方向；能够覆盖
          <strong>需求拆解、方案设计、前后端编码、测试联调、部署运维</strong>
          的完整交付闭环，重视权限体系、设计系统、工程质量与跨团队协作。
        </p>

        <p class="about-author-dialog__closing">
          我擅长在复杂需求中找到清晰的落点，也愿意持续用工程实践验证产品想法。金鱼星球正是这份思考的公开实验场。
        </p>
      </div>
    </el-dialog>
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
  min-height: 620px;
  color: #f7faf7;
  background-color: var(--night);
}
.about-hero__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 276px;
  align-items: center;
  gap: 60px;
}

.about-builder-card {
  justify-self: end;
  width: 100%;
  padding: 20px;
  border: 1px solid rgba(232, 242, 233, 0.2);
  border-radius: 12px;
  background: rgba(7, 19, 21, 0.48);
}
.about-builder-card__eyebrow {
  margin: 0 0 14px;
  color: #c7d4ca;
  font-family: 'Source Sans 3', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}
.about-builder-card__avatar {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 1px solid rgba(226, 184, 73, 0.7);
  border-radius: 50%;
  color: #d8c27a;
  background: rgba(23, 51, 54, 0.7);
  font-size: 16px;
  font-weight: 700;
}
.about-builder-card strong,
.about-builder-card small {
  display: block;
}
.about-builder-card strong {
  color: #fffef9;
  font-size: 18px;
}
.about-builder-card small {
  color: #bdd0c4;
  font-size: 13px;
}
.about-builder-card > p:not(.about-builder-card__eyebrow) {
  margin: 16px 0;
  color: #c7d4ca;
  font-size: 13px;
  line-height: 1.75;
}
.about-builder-card__links {
  display: grid;
  gap: 9px;
}
.about-builder-card__links a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid rgba(232, 242, 233, 0.16);
  color: #d9e4dc;
  font-size: 13px;
}
.about-builder-card__links button,
.about-builder-section__links button {
  width: 100%;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
}
.about-builder-card__links button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid rgba(232, 242, 233, 0.16);
  color: #d9e4dc;
  font-size: 13px;
}
.about-builder-card__links a:hover {
  color: var(--accent);
}
.about-builder-card__links button:hover {
  color: var(--accent);
}

.about-planet-notes {
  background: #fffef9;
}
.about-planet-notes__inner {
  padding-top: 72px;
  padding-bottom: 82px;
}
.about-planet-notes__intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.7fr);
  gap: 64px;
  align-items: end;
  padding-bottom: 42px;
  border-bottom: 1px solid var(--line);
}
.about-planet-notes__intro .eyebrow {
  margin-bottom: 18px;
  color: var(--accent-deep);
}
.about-planet-notes h2 {
  margin: 0;
  color: var(--ink);
  font-size: clamp(28px, 3vw, 40px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.25;
}
.about-planet-notes__intro > p {
  margin: 0;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.8;
}
.about-planet-notes__groups {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.65fr);
  gap: 72px;
  padding-top: 42px;
}
.about-planet-notes__label {
  margin: 0 0 18px;
  color: #8a948d;
  font-family: 'Source Sans 3', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
}
.about-planet-notes__label--current {
  color: var(--accent-deep);
}

.about-feature-list,
.about-roadmap-list {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--line);
}
.about-feature-list li {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  align-items: center;
  column-gap: 24px;
  min-height: 112px;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}
.about-feature-list__number {
  display: grid;
  width: 76px;
  height: 76px;
  place-items: center;
  border: 1px solid var(--accent-deep);
  border-radius: 50%;
  color: transparent;
  font-family: 'Source Sans 3', monospace;
  font-size: 50px;
  font-weight: 700;
  -webkit-text-stroke: 0.8px var(--accent-deep);
}
.about-feature-list__copy {
  min-width: 0;
}
.about-feature-list strong,
.about-roadmap-list strong,
.about-feature-list small,
.about-roadmap-list small {
  display: block;
}
.about-feature-list strong {
  margin-bottom: 3px;
  color: var(--ink);
  font-size: 16px;
}
.about-feature-list small {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.8;
}
.about-roadmap-list li {
  position: relative;
  padding: 12px 0 12px 20px;
  border-bottom: 1px solid var(--line);
}
.about-roadmap-list li::before {
  position: absolute;
  top: 22px;
  left: 2px;
  width: 6px;
  height: 6px;
  border: 1px solid #a9b1aa;
  border-radius: 50%;
  content: '';
}
.about-roadmap-list strong {
  margin-bottom: 3px;
  color: #52615b;
  font-size: 14px;
  font-weight: 600;
}
.about-roadmap-list small {
  color: #8a948d;
  font-size: 13px;
  line-height: 1.7;
}

.about-builder-section {
  color: #eff6f0;
  background-position: center;
  background-size: cover;
}
.about-builder-section__inner {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  align-items: center;
  gap: 70px;
  padding-top: 70px;
  padding-bottom: 70px;
}
.about-builder-section h2 {
  margin: 0 0 10px;
  font-size: clamp(28px, 3vw, 40px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.25;
}
.about-builder-section p:not(.eyebrow) {
  margin: 0;
  color: #c5d4c8;
  line-height: 1.9;
}
.about-builder-section__links {
  display: grid;
  border-top: 1px solid rgba(222, 237, 225, 0.26);
}
.about-builder-section__links a {
  display: flex;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid rgba(222, 237, 225, 0.26);
  color: #f5f8f4;
  font-size: 15px;
}
.about-builder-section__links button {
  display: flex;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid rgba(222, 237, 225, 0.26);
  color: #f5f8f4;
  font-size: 15px;
}
.about-builder-section__links a:hover {
  color: var(--accent);
}
.about-builder-section__links button:hover {
  color: var(--accent);
}
.about-builder-section__placeholder {
  padding: 15px 0;
  color: #c5d4c8;
  font-size: 14px;
}

:global(.about-author-dialog.el-dialog) {
  overflow: hidden;
  margin: auto;
  border: 1px solid rgba(199, 168, 64, 0.22);
  border-radius: 18px;
  background: #fffef9;
  box-shadow: 0 24px 80px rgba(6, 20, 20, 0.28);
}
:global(.about-author-dialog .el-dialog__header) {
  margin: 0;
  padding: 28px 32px 0;
}
:global(.about-author-dialog .el-dialog__body) {
  padding: 0 32px 32px;
}
.about-author-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.about-author-dialog__header p {
  margin: 0;
  color: var(--accent-deep);
  font-family: 'Source Sans 3', monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}
.about-author-dialog__header button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: #58665e;
  background: transparent;
  cursor: pointer;
  font-size: 24px;
  font-weight: 300;
  line-height: 1;
}
.about-author-dialog__header button:hover {
  border-color: var(--accent-deep);
  color: var(--accent-deep);
}
.about-author-dialog__identity {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0 22px;
}
.about-author-dialog__identity > span {
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  border: 1px solid rgba(180, 139, 44, 0.65);
  border-radius: 50%;
  color: var(--accent-deep);
  background: #f4f3e8;
  font-size: 20px;
  font-weight: 700;
}
.about-author-dialog__identity h2,
.about-author-dialog__identity p {
  margin: 0;
}
.about-author-dialog__identity h2 {
  color: var(--ink);
  font-size: 24px;
}
.about-author-dialog__identity p {
  margin-top: 4px;
  color: var(--muted);
  font-size: 14px;
}
.about-author-dialog__identity p strong {
  color: #59665f;
  font-weight: 600;
}
.about-author-dialog__lead {
  margin: 0;
  color: #47544e;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.8;
}
.about-author-dialog__skills {
  display: grid;
  gap: 8px;
  margin: 24px 0 0;
  padding: 18px 20px;
  border-radius: 10px;
  background: #f4f5ed;
}
.about-author-dialog__skills p,
.about-author-dialog__skills span {
  display: block;
  margin: 0;
}
.about-author-dialog__skills p {
  margin-bottom: 3px;
  color: var(--accent-deep);
  font-size: 14px;
  font-weight: 700;
}
.about-author-dialog__skills span {
  color: #66736a;
  font-size: 13px;
  line-height: 1.75;
}
.about-author-dialog__skills strong {
  color: #3d4a43;
  font-weight: 700;
}
.about-author-dialog__advantage-title {
  margin: 26px 0 8px;
  color: var(--accent-deep);
  font-size: 16px;
  font-weight: 700;
}
.about-author-dialog__advantage {
  margin: 0;
  color: #66736a;
  font-size: 14px;
  line-height: 1.85;
}
.about-author-dialog__advantage strong,
.about-author-dialog__lead strong {
  color: #3e4b44;
  font-weight: 700;
}
.about-author-dialog__closing {
  margin: 0;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  color: #6c776f;
  font-size: 14px;
  line-height: 1.8;
}

@media (max-width: 1024px) {
  .about-hero {
    min-height: auto;
  }
  .about-hero__inner {
    grid-template-columns: 1fr;
    gap: 40px;
    padding-top: 138px;
    padding-bottom: 66px;
  }
  .about-builder-card {
    max-width: 400px;
    justify-self: start;
  }
  .about-planet-notes__intro,
  .about-planet-notes__groups,
  .about-builder-section__inner {
    grid-template-columns: 1fr;
    gap: 36px;
  }
}
@media (max-width: 560px) {
  .about-feature-list li {
    grid-template-columns: 64px minmax(0, 1fr);
    column-gap: 16px;
  }
  .about-feature-list__number {
    width: 64px;
    height: 64px;
    font-size: 42px;
  }
  .about-planet-notes__inner {
    padding-top: 54px;
    padding-bottom: 60px;
  }
  .about-builder-section__inner {
    padding-top: 58px;
    padding-bottom: 58px;
  }
  :global(.about-author-dialog .el-dialog__header) {
    padding: 24px 22px 0;
  }
  :global(.about-author-dialog .el-dialog__body) {
    padding: 0 22px 24px;
  }
}
</style>
