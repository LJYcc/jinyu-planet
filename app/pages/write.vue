<script setup lang="ts">
import { DocumentChecked, RefreshRight, View } from '@element-plus/icons-vue';
import { v4 as uuidv4 } from 'uuid';
import { onBeforeRouteLeave } from 'vue-router';
import writeHeroBg from '~/assets/images/bg-write-desk-dawn-hero.png';
import writeBottomBg from '~/assets/images/bg-night-mountain-stars.png';
import ArticleContent from '~/components/posts/article-content.vue';
import PostEditor from '~/components/posts/post-editor.vue';
import type { ApiSuccess } from '~/types/api';
import type { PublicTopic } from '~/types/post';

type PostType = 'article' | 'short' | 'photo' | 'link';
type Draft = {
  type: PostType;
  topic: string;
  title: string;
  contentHtml: string;
  externalUrl: string;
  tags: string[];
  clientNonce: string;
};

const DRAFT_STORAGE_KEY = 'goldfish-planet-write-draft-v1';
const POST_TYPES: Array<{ value: PostType; label: string }> = [
  { value: 'article', label: '长文' },
  { value: 'short', label: '短帖' },
  { value: 'photo', label: '图文' },
  { value: 'link', label: '链接分享' }
];
const POST_TYPE_RULES: Record<
  PostType,
  {
    note: string;
    titleLabel: string;
    titlePlaceholder: string;
    contentLabel: string;
    contentPlaceholder: string;
    titleMode: 'required' | 'optional' | 'hidden';
    isContentRequired: boolean;
    maxTextLength: number;
  }
> = {
  article: {
    note: '适合完整观点、经验复盘或较长的故事。标题必填，摘要会自动从正文生成。',
    titleLabel: '文章标题',
    titlePlaceholder: '用一句话说明这篇长文想讲什么',
    contentLabel: '正文',
    contentPlaceholder: '写下完整的想法、故事或经验...',
    titleMode: 'required',
    isContentRequired: true,
    maxTextLength: 12000
  },
  short: {
    note: '适合一句灵感、状态或小观察。不需要标题，列表会直接用正文开头展示。',
    titleLabel: '',
    titlePlaceholder: '',
    contentLabel: '短帖内容',
    contentPlaceholder: '直接写下这条短信号，建议 500 字以内...',
    titleMode: 'hidden',
    isContentRequired: true,
    maxTextLength: 500
  },
  photo: {
    note: '适合围绕一张图讲清楚场景、心情或故事。标题可选，图片上传会在存储服务接入后开放。',
    titleLabel: '图文标题（可选）',
    titlePlaceholder: '例如：傍晚六点的天桥',
    contentLabel: '图文说明',
    contentPlaceholder: '描述这张图里的场景、人物、心情或故事...',
    titleMode: 'optional',
    isContentRequired: true,
    maxTextLength: 4000
  },
  link: {
    note: '适合分享一篇文章、一个工具或一个发现。链接和标题必填，推荐语可选。',
    titleLabel: '链接标题',
    titlePlaceholder: '这个链接是什么，为什么值得打开',
    contentLabel: '推荐语（可选）',
    contentPlaceholder: '可以补充你为什么推荐它；不写也可以直接发布链接。',
    titleMode: 'required',
    isContentRequired: false,
    maxTextLength: 2000
  }
};

useSeoMeta({ title: '投递新信号 | 金鱼星球', description: '写下想被读到的一点真心。' });

const { visitor, bootstrap, changeNickname } = useVisitor();
const topics = ref<PublicTopic[]>([]);
const loadError = ref('');
const isReady = ref(false);
const isSubmitting = ref(false);
const isChangingNickname = ref(false);
const isDirty = ref(false);
const previewVisible = ref(false);
const publishedSlug = ref('');
const publishError = ref('');
const form = reactive<Draft>({
  type: 'article',
  topic: '',
  title: '',
  contentHtml: '',
  externalUrl: '',
  tags: [],
  clientNonce: ''
});

const activeTypeRule = computed(() => POST_TYPE_RULES[form.type]);
const shouldShowTitle = computed(() => activeTypeRule.value.titleMode !== 'hidden');
const isTitleRequired = computed(() => activeTypeRule.value.titleMode === 'required');
const contentLength = computed(() => contentText().length);
const previewTitle = computed(() => form.title.trim() || contentText());
const canPublish = computed(() => Boolean(visitor.value && form.topic && form.clientNonce && !isSubmitting.value));

function createNonce() {
  return uuidv4();
}

function isPostType(value: unknown): value is PostType {
  return typeof value === 'string' && POST_TYPES.some(type => type.value === value);
}

function restoreDraft() {
  try {
    const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!rawDraft) return;
    const draft = JSON.parse(rawDraft) as Partial<Draft>;
    if (!isPostType(draft.type)) return;

    form.type = draft.type;
    form.topic = typeof draft.topic === 'string' ? draft.topic : '';
    form.title = typeof draft.title === 'string' ? draft.title : '';
    form.contentHtml = typeof draft.contentHtml === 'string' ? draft.contentHtml : '';
    form.externalUrl = typeof draft.externalUrl === 'string' ? draft.externalUrl : '';
    form.tags = Array.isArray(draft.tags)
      ? draft.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 5)
      : [];
    form.clientNonce = typeof draft.clientNonce === 'string' ? draft.clientNonce : '';
  } catch {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  }
}

function persistDraft() {
  if (!isReady.value || publishedSlug.value) return;
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
}

function contentText() {
  if (typeof DOMParser === 'undefined')
    return form.contentHtml
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  return (
    new DOMParser().parseFromString(form.contentHtml, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  );
}

function validateBeforePreview() {
  if (!form.topic) return '请选择一个主题。';
  if (isTitleRequired.value && !form.title.trim()) return `${activeTypeRule.value.titleLabel}需要填写。`;
  if (activeTypeRule.value.isContentRequired && !contentText()) return `请先填写${activeTypeRule.value.contentLabel}。`;
  if (contentLength.value > activeTypeRule.value.maxTextLength)
    return `${activeTypeRule.value.contentLabel}不能超过 ${activeTypeRule.value.maxTextLength} 字。`;
  if (form.type === 'link' && !form.externalUrl.trim()) return '链接分享需要填写原始链接。';
  return '';
}

function openPreview() {
  const message = validateBeforePreview();
  if (message) return ElMessage.warning(message);
  previewVisible.value = true;
}

async function loadWriteData() {
  loadError.value = '';
  try {
    const [topicResponse] = await Promise.all([$fetch<ApiSuccess<PublicTopic[]>>('/api/topics'), bootstrap()]);
    topics.value = topicResponse.data;
    if (!form.topic && topics.value[0]) form.topic = topics.value[0].slug;
  } catch {
    loadError.value = '无法连接星球服务，请刷新页面后重试。';
  }
}

async function rotateNickname() {
  isChangingNickname.value = true;
  try {
    await changeNickname();
    ElMessage.success('已换一个昵称，历史和之后投递的信号都会显示新署名。');
  } catch {
    ElMessage.error('暂时无法更换昵称，请稍后再试。');
  } finally {
    isChangingNickname.value = false;
  }
}

async function publishPost() {
  const message = validateBeforePreview();
  if (message) return ElMessage.warning(message);

  isSubmitting.value = true;
  publishError.value = '';
  try {
    const response = await $fetch<ApiSuccess<{ slug: string }, { created: boolean }>>('/api/posts', {
      method: 'POST',
      body: {
        type: form.type,
        topic: form.topic,
        title: form.type === 'short' ? '' : form.title,
        contentHtml: form.contentHtml,
        externalUrl: form.type === 'link' ? form.externalUrl : '',
        tags: form.tags,
        clientNonce: form.clientNonce
      }
    });
    publishedSlug.value = response.data.slug;
    isDirty.value = false;
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    ElMessage.success(response.metadata?.created ? '信号已投递到金鱼星球。' : '这条信号已经投递成功。');
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } }).response?.status;
    publishError.value = status === 429 ? '投递过于频繁，请稍后再试。' : '投递失败，请检查内容后重试。';
  } finally {
    isSubmitting.value = false;
  }
}

function continueWriting() {
  publishedSlug.value = '';
  form.title = '';
  form.contentHtml = '';
  form.externalUrl = '';
  form.tags = [];
  form.clientNonce = createNonce();
}

function confirmDiscard() {
  return !isDirty.value || window.confirm('草稿已保存在本机，仍要离开当前页面吗？');
}

watch(
  form,
  () => {
    if (!isReady.value) return;
    isDirty.value = true;
    persistDraft();
  },
  { deep: true }
);

onMounted(async () => {
  restoreDraft();
  if (!form.clientNonce) form.clientNonce = createNonce();
  isReady.value = true;
  await loadWriteData();
  isDirty.value = false;
});

onBeforeRouteLeave(() => confirmDiscard());
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!isDirty.value) return;
  event.preventDefault();
  event.returnValue = '';
};
onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload));
onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload));
</script>

<template>
  <div class="write-page">
    <section
      class="write-hero page-photo-hero"
      :style="{
        backgroundImage: `linear-gradient(90deg, rgba(5, 15, 18, 0.48), rgba(5, 15, 18, 0.08)), url(${writeHeroBg})`
      }"
    >
      <div class="shell-container write-hero__inner flex h-full min-h-0 flex-col justify-center pt-[82px]">
        <p class="eyebrow eyebrow--light">SHARE YOUR SIGNAL</p>
        <h1 class="m-0 text-[50px] font-bold leading-[1.08] md:text-[76px]">投递新信号</h1>
        <p class="mt-[18px] mb-0 max-w-[620px] text-[19px] font-semibold leading-[1.8] text-[#f6f8f1]">
          把今天还没有答案的想法，安静地投进这颗星球。
        </p>
      </div>
    </section>

    <section class="write-board shell-container">
      <div
        v-if="loadError"
        class="mb-7"
        role="alert"
      >
        <el-alert
          :title="loadError"
          type="error"
          show-icon
          :closable="false"
        />
      </div>
      <div
        v-else-if="!isReady"
        class="write-page__loading py-16"
        role="status"
      >
        <span>编辑器正在准备中...</span>
      </div>

      <div
        v-else
        class="write-layout grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px]"
      >
        <main class="write-main">
          <div class="write-section-title">
            <h2>分享你的想法</h2>
          </div>
          <el-form
            label-position="top"
            class="write-form"
          >
            <el-form-item label="信号类型">
              <el-radio-group
                v-model="form.type"
                class="write-type-group"
              >
                <el-radio-button
                  v-for="type in POST_TYPES"
                  :key="type.value"
                  :value="type.value"
                  >{{ type.label }}</el-radio-button
                >
              </el-radio-group>
              <p class="write-type-note">{{ activeTypeRule.note }}</p>
            </el-form-item>

            <el-form-item
              v-if="shouldShowTitle"
              :label="activeTypeRule.titleLabel"
              :required="isTitleRequired"
            >
              <el-input
                v-model="form.title"
                maxlength="160"
                show-word-limit
                :placeholder="activeTypeRule.titlePlaceholder"
              />
            </el-form-item>
            <el-form-item
              v-if="form.type === 'link'"
              label="原始链接"
              required
            >
              <el-input
                v-model="form.externalUrl"
                maxlength="2048"
                placeholder="https://example.com"
                inputmode="url"
              />
            </el-form-item>
            <el-alert
              v-if="form.type === 'photo'"
              class="mb-5"
              title="图片上传服务尚未接入；你可以先完成图文说明，图片功能将在存储服务接入后开放。"
              type="info"
              show-icon
              :closable="false"
            />

            <el-form-item
              :label="activeTypeRule.contentLabel"
              :required="activeTypeRule.isContentRequired"
            >
              <post-editor
                v-model="form.contentHtml"
                :placeholder="activeTypeRule.contentPlaceholder"
              />
              <p class="write-field-hint">
                {{ contentLength }} / {{ activeTypeRule.maxTextLength }} 字，摘要会由系统自动生成。
              </p>
            </el-form-item>
          </el-form>

          <div class="writing-note grid gap-4 sm:grid-cols-[42px_minmax(0,1fr)]">
            <span aria-hidden="true">◇</span>
            <p>不必追求完美，真实的想法就很好。这里是一个温柔的角落，你可以放心地表达。</p>
          </div>

          <div
            v-if="publishError"
            class="mb-5"
            role="alert"
          >
            <el-alert
              :title="publishError"
              type="error"
              show-icon
              :closable="false"
            />
          </div>
          <div
            class="write-actions grid gap-4 border-t border-[var(--line)] pt-7 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            <el-button
              :icon="View"
              size="large"
              @click="openPreview"
              >预览</el-button
            >
            <el-button
              type="primary"
              :icon="DocumentChecked"
              size="large"
              :loading="isSubmitting"
              :disabled="!canPublish"
              @click="publishPost"
            >
              投递到金鱼星球
            </el-button>
          </div>
        </main>

        <aside class="write-aside">
          <section class="write-side-block">
            <h2>当前署名</h2>
            <div class="write-identity">
              <strong>{{ visitor?.nickname || '正在生成昵称...' }}</strong>
              <el-button
                :icon="RefreshRight"
                text
                size="small"
                :loading="isChangingNickname"
                @click="rotateNickname"
              >
                换一个昵称
              </el-button>
            </div>
          </section>

          <section class="write-side-block">
            <el-form
              label-position="top"
              class="write-form"
            >
              <el-form-item
                label="选择主题"
                required
              >
                <el-select
                  v-model="form.topic"
                  placeholder="选择一个主题"
                  class="w-full"
                >
                  <el-option
                    v-for="topic in topics"
                    :key="topic.slug"
                    :label="topic.name"
                    :value="topic.slug"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="添加标签">
                <el-select
                  v-model="form.tags"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  placeholder="输入标签后按回车"
                  class="w-full"
                >
                  <el-option
                    v-for="tag in form.tags"
                    :key="tag"
                    :label="tag"
                    :value="tag"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </section>

          <section class="write-safety">
            <p>请勿发布个人隐私、违法或攻击性内容。</p>
          </section>

          <section class="write-saved">
            <strong>草稿已保存</strong>
            <span>草稿会自动保存在当前浏览器。</span>
          </section>

          <blockquote>
            有些想法现在还没有答案，但它依然值得被好好放下。
            <span>—— 金鱼星球</span>
          </blockquote>
        </aside>
      </div>
    </section>

    <section
      class="write-bottom-visual"
      :style="{
        backgroundImage: `linear-gradient(90deg, rgba(7, 17, 19, 0.62), rgba(7, 17, 19, 0.18)), url(${writeBottomBg})`
      }"
    >
      <div class="shell-container">
        <p>好好生活，<br />也值得被看见。</p>
      </div>
    </section>

    <el-dialog
      v-model="previewVisible"
      title="投递预览"
      width="min(720px, calc(100% - 32px))"
      align-center
    >
      <article class="write-preview">
        <p class="mb-3 text-sm font-semibold text-[var(--accent-deep)]">
          {{ topics.find(topic => topic.slug === form.topic)?.name }}
        </p>
        <h2 class="m-0 text-[28px] leading-[1.3]">{{ previewTitle }}</h2>
        <p class="mt-3 mb-7 text-sm text-[var(--muted)]">
          {{ visitor?.nickname }} · 预计 {{ Math.max(1, Math.ceil(contentText().length / 400)) }} 分钟阅读
        </p>
        <a
          v-if="form.type === 'link' && form.externalUrl"
          class="write-preview__link"
          :href="form.externalUrl"
          target="_blank"
          rel="noopener noreferrer"
          >{{ form.externalUrl }}</a
        >
        <article-content
          v-if="contentText()"
          :html="form.contentHtml"
        />
      </article>
      <template #footer>
        <el-button @click="previewVisible = false">继续编辑</el-button>
        <el-button
          type="primary"
          :loading="isSubmitting"
          @click="publishPost"
          >确认投递</el-button
        >
      </template>
    </el-dialog>

    <el-dialog
      :model-value="Boolean(publishedSlug)"
      title="信号已抵达星球"
      width="min(460px, calc(100% - 32px))"
      align-center
      :close-on-click-modal="false"
      @close="continueWriting"
    >
      <p class="m-0 leading-[1.8] text-[var(--muted)]">你的文字已经公开显示在金鱼星球，可以继续浏览或再写一条信号。</p>
      <template #footer>
        <nuxt-link
          v-slot="{ navigate }"
          to="/posts"
          custom
        >
          <el-button @click="navigate">浏览星球广场</el-button>
        </nuxt-link>
        <nuxt-link
          v-slot="{ navigate }"
          :to="`/posts/${publishedSlug}`"
          custom
        >
          <el-button
            type="primary"
            @click="navigate"
            >查看这条信号</el-button
          >
        </nuxt-link>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.write-page {
  background: #f7f8f3;
}

.eyebrow--light {
  color: #dce8df;
}

.write-hero {
  color: #f7faf7;
  background-color: var(--night);
}

.write-board {
  padding-top: 38px;
  padding-bottom: 38px;
}

.write-page__loading span {
  display: block;
  width: min(100%, 760px);
  padding: 34px;
  border: 1px solid var(--line);
  color: var(--muted);
  background: #fff;
}

.write-main {
  min-width: 0;
  padding-right: 34px;
  border-right: 1px solid var(--line);
}

.write-section-title {
  margin-bottom: 22px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}

.write-section-title h2,
.write-side-block h2 {
  margin: 0;
  color: var(--ink);
  font-size: 24px;
  font-weight: 700;
}

.write-form :deep(.el-form-item__label) {
  color: var(--ink);
  font-size: 14px;
  font-weight: 700;
}

.write-form :deep(.el-form-item) {
  margin-bottom: 25px;
}

.write-type-group {
  display: grid;
  width: 100%;
  gap: 14px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.write-type-group :deep(.el-radio-button__inner) {
  width: 100%;
  border-left: var(--el-border);
  border-radius: 0;
}

.write-type-note,
.write-field-hint {
  width: 100%;
  margin: 9px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

.writing-note {
  margin: 2px 0 30px;
  color: var(--muted);
}

.writing-note span {
  color: var(--accent-deep);
  font-size: 30px;
}

.writing-note p {
  margin: 0;
  font-size: 14px;
  line-height: 1.9;
}

.write-actions :deep(.el-button) {
  margin: 0;
}

.write-aside {
  display: grid;
  align-content: start;
  gap: 26px;
}

.write-side-block {
  padding-bottom: 22px;
  border-bottom: 1px solid var(--line);
}

.write-identity {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.write-identity strong {
  color: var(--ink);
  font-size: 18px;
}

.write-safety {
  padding: 18px;
  border: 1px solid var(--line);
  background: #f1f3ee;
}

.write-safety p,
.write-saved span {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

.write-saved {
  display: grid;
  gap: 8px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--line);
}

.write-saved strong {
  color: var(--ink);
}

.write-aside blockquote {
  margin: 0;
  color: #87918c;
  font-size: 15px;
  line-height: 2;
}

.write-aside blockquote span {
  display: block;
  margin-top: 18px;
}

.write-bottom-visual {
  min-height: 360px;
  display: flex;
  align-items: center;
  color: #fff;
  background-position: center;
  background-size: cover;
}

.write-bottom-visual p {
  margin: 0;
  max-width: 390px;
  font-size: 38px;
  font-weight: 700;
  line-height: 1.35;
}

.write-preview {
  max-width: 640px;
  margin: 0 auto;
}

.write-preview__link {
  display: inline-flex;
  max-width: 100%;
  overflow-wrap: anywhere;
  margin-bottom: 18px;
  color: var(--accent-deep);
  font-size: 14px;
  font-weight: 700;
}

@media (max-width: 1024px) {
  .write-main {
    padding-right: 0;
    border-right: 0;
  }

  .write-aside {
    padding-top: 30px;
    border-top: 1px solid var(--line);
  }
}

@media (max-width: 640px) {
  .write-type-group {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .write-bottom-visual {
    min-height: 280px;
  }

  .write-bottom-visual p {
    font-size: 30px;
  }
}
</style>
