<script setup lang="ts">
import type { UploadFile } from 'element-plus';
import { ElMessageBox } from 'element-plus';
import { v4 as uuidv4 } from 'uuid';
import { onBeforeRouteLeave } from 'vue-router';
import writeHeroBg from '~/assets/images/bg-write-desk-dawn-hero.png';
import writeBottomBg from '~/assets/images/bg-night-mountain-stars.png';
import ArticleContent from '~/components/posts/article-content.vue';
import WriteContentEditor from '~/components/posts/write-content-editor.vue';
import WriteSignalSettings from '~/components/posts/write-signal-settings.vue';
import { uploadPostCover } from '~/services/file-upload-api';
import { createPost } from '~/services/post-api';
import { listTopics } from '~/services/topic-api';
import type { PublicTopic } from '~/types/post';

type Draft = {
  topic: string;
  title: string;
  contentHtml: string;
  tags: string[];
  coverAssetId: string | null;
  coverName: string;
  bodyImageAssetIds: string[];
  clientNonce: string;
};

const DRAFT_STORAGE_KEY = 'goldfish-planet-write-draft-v1';

useSeoMeta({ title: '投递新信号 | 金鱼星球', description: '写下想被读到的一点真心。' });

const { visitor, bootstrap, changeNickname } = useVisitor();
const route = useRoute();
const topics = ref<PublicTopic[]>([]);
const loadError = ref('');
const isReady = ref(false);
const isSubmitting = ref(false);
const isChangingNickname = ref(false);
const isDirty = ref(false);
const isCoverUploading = ref(false);
const coverPreviewUrl = ref('');
const coverPreviewVisible = ref(false);
const previewVisible = ref(false);
const publishedSlug = ref('');
const publishError = ref('');
const form = reactive<Draft>({
  topic: '',
  title: '',
  contentHtml: '',
  tags: [],
  coverAssetId: null,
  coverName: '',
  bodyImageAssetIds: [],
  clientNonce: ''
});

const contentLength = computed(() => contentText().length);
const previewTitle = computed(() => form.title.trim() || contentText());
const canPublish = computed(() =>
  Boolean(visitor.value && form.topic && form.clientNonce && !isSubmitting.value && !isCoverUploading.value)
);

function createNonce() {
  return uuidv4();
}

function restoreDraft() {
  try {
    const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!rawDraft) return;
    const draft = JSON.parse(rawDraft) as Partial<Draft>;
    form.topic = typeof draft.topic === 'string' ? draft.topic : '';
    form.title = typeof draft.title === 'string' ? draft.title : '';
    form.contentHtml = typeof draft.contentHtml === 'string' ? draft.contentHtml : '';
    form.tags = Array.isArray(draft.tags)
      ? draft.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 5)
      : [];
    form.coverAssetId = typeof draft.coverAssetId === 'string' ? draft.coverAssetId : null;
    form.coverName = typeof draft.coverName === 'string' ? draft.coverName : '';
    form.bodyImageAssetIds = Array.isArray(draft.bodyImageAssetIds)
      ? draft.bodyImageAssetIds.filter((id): id is string => typeof id === 'string')
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
  if (!form.title.trim()) return '请填写标题。';
  if (!contentText()) return '请先填写正文。';
  if (contentLength.value > 12000) return '正文不能超过 12000 字。';
  if (isCoverUploading.value) return '封面仍在上传，请稍候。';
  return '';
}

async function handleCoverChange(uploadFile: UploadFile) {
  const file = uploadFile.raw;
  if (!file) return;
  if (!file.type.startsWith('image/')) return ElMessage.warning('封面只能上传图片文件。');

  isCoverUploading.value = true;
  form.coverAssetId = null;
  form.coverName = '';
  if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value);
  coverPreviewUrl.value = URL.createObjectURL(file);
  try {
    const cover = await uploadPostCover(file);
    form.coverAssetId = cover.id;
    form.coverName = cover.originalName;
    ElMessage.success('封面已上传。');
  } catch {
    if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value);
    coverPreviewUrl.value = '';
    ElMessage.error('封面上传失败，请稍后重试。');
  } finally {
    isCoverUploading.value = false;
  }
}

function removeCover() {
  form.coverAssetId = null;
  form.coverName = '';
  coverPreviewVisible.value = false;
  if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value);
  coverPreviewUrl.value = '';
}

function openCoverPreview(event: MouseEvent) {
  event.stopPropagation();
  if (coverPreviewUrl.value) coverPreviewVisible.value = true;
}

function addBodyImageAsset(assetId: string) {
  if (!form.bodyImageAssetIds.includes(assetId)) form.bodyImageAssetIds.push(assetId);
}

function openPreview() {
  const message = validateBeforePreview();
  if (message) return ElMessage.warning(message);
  previewVisible.value = true;
}

async function loadWriteData() {
  loadError.value = '';
  try {
    const [topicsData] = await Promise.all([listTopics(), bootstrap()]);
    topics.value = topicsData;
    const requestedTopic = typeof route.query.topic === 'string' ? route.query.topic : '';
    if (requestedTopic && topics.value.some(topic => topic.slug === requestedTopic)) {
      form.topic = requestedTopic;
    } else if (!form.topic && topics.value[0]) {
      form.topic = topics.value[0].slug;
    }
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
    const result = await createPost({
      topic: form.topic,
      title: form.title,
      contentHtml: form.contentHtml,
      tags: form.tags,
      coverAssetId: form.coverAssetId,
      bodyImageAssetIds: form.bodyImageAssetIds,
      clientNonce: form.clientNonce
    });
    publishedSlug.value = result.slug;
    isDirty.value = false;
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    ElMessage.success(result.created ? '信号已投递到金鱼星球。' : '这条信号已经投递成功。');
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } }).response?.status;
    publishError.value = status === 429 ? '投递过于频繁，请稍后再试。' : '投递失败，请检查内容后重试。';
  } finally {
    isSubmitting.value = false;
  }
}

async function confirmPublish() {
  const message = validateBeforePreview();
  if (message) return ElMessage.warning(message);

  try {
    await ElMessageBox.confirm('投递后内容将公开显示在金鱼星球，确认现在投递吗？', '确认投递', {
      confirmButtonText: '确认投递',
      cancelButtonText: '继续编辑',
      type: 'warning'
    });
    await publishPost();
  } catch {
    // 用户取消确认时保持当前草稿，不显示额外提示。
  }
}

function continueWriting() {
  publishedSlug.value = '';
  form.title = '';
  form.contentHtml = '';
  form.tags = [];
  form.bodyImageAssetIds = [];
  removeCover();
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
  window.addEventListener('beforeunload', handleBeforeUnload);
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
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
  if (coverPreviewUrl.value) URL.revokeObjectURL(coverPreviewUrl.value);
});
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
        <h1 class="planet-hero-title m-0 text-[50px] font-bold leading-[1.08] md:text-[76px]">投递新信号</h1>
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
        <write-signal-settings
          :nickname="visitor?.nickname"
          :topics="topics"
          v-model:title="form.title"
          v-model:topic="form.topic"
          v-model:tags="form.tags"
          :cover-preview-url="coverPreviewUrl"
          :is-cover-uploading="isCoverUploading"
          :is-changing-nickname="isChangingNickname"
          :is-submitting="isSubmitting"
          :can-publish="canPublish"
          :publish-error="publishError"
          @cover-change="handleCoverChange"
          @preview-cover="openCoverPreview"
          @remove-cover="removeCover"
          @rotate-nickname="rotateNickname"
          @preview="openPreview"
          @publish="confirmPublish"
        />
        <write-content-editor
          v-model:content-html="form.contentHtml"
          :content-length="contentLength"
          :publish-error="publishError"
          :can-publish="canPublish"
          :is-submitting="isSubmitting"
          @image-uploaded="addBodyImageAsset"
          @preview="openPreview"
          @publish="confirmPublish"
        />
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
      class="write-preview-dialog"
      width="min(960px, calc(100% - 32px))"
      align-center
    >
      <article class="write-preview">
        <header class="write-preview__header">
          <div class="write-preview__topic">
            <span aria-hidden="true">#</span>
            {{ topics.find(topic => topic.slug === form.topic)?.name }}
          </div>
          <h1>{{ previewTitle }}</h1>
          <div class="write-preview__meta">
            <span class="write-preview__author">
              <span
                class="write-preview__author-avatar"
                aria-hidden="true"
                >{{ visitor?.nickname?.slice(0, 1) }}</span
              >
              <strong>{{ visitor?.nickname }}</strong>
            </span>
            <span
              class="write-preview__meta-separator"
              aria-hidden="true"
              >/</span
            >
            <span>刚刚</span>
            <span
              class="write-preview__meta-separator"
              aria-hidden="true"
              >/</span
            >
            <span>预计 {{ Math.max(1, Math.ceil(contentText().length / 400)) }} 分钟阅读</span>
          </div>
        </header>
        <div class="write-preview__body">
          <article-content
            v-if="contentText()"
            :html="form.contentHtml"
          />
        </div>
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

    <el-image-viewer
      v-if="coverPreviewVisible && coverPreviewUrl"
      :url-list="[coverPreviewUrl]"
      @close="coverPreviewVisible = false"
    />

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
  display: flex;
  height: 100%;
  min-height: 0;
  width: 100%;
  flex-direction: column;
  margin: 0 auto;
}

:global(.write-preview-dialog.el-dialog) {
  display: flex;
  height: min(760px, calc(100vh - 64px));
  margin: auto;
  flex-direction: column;
}

:global(.write-preview-dialog .el-dialog__body) {
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  padding: 0 24px;
}

:global(.write-preview-dialog .el-dialog__footer) {
  flex: 0 0 auto;
}

.write-preview__header {
  flex: 0 0 auto;
  padding: 0 0 18px;
  border-bottom: 1px solid var(--line);
}

.write-preview__topic {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  color: #9a7b16;
  background: #fbf0c8;
  font-size: 12px;
  font-weight: 700;
}

.write-preview__topic span {
  color: var(--accent-deep);
}

.write-preview__header h1 {
  max-width: 800px;
  margin: 10px 0 0;
  color: var(--ink);
  font-size: clamp(32px, 3vw, 42px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.write-preview__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  color: var(--muted);
  font-size: 12px;
}

.write-preview__author {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--ink);
}

.write-preview__author-avatar {
  display: inline-grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  color: #eef5ef;
  background: var(--night-soft);
  font-size: 12px;
  font-weight: 700;
}

.write-preview__meta-separator {
  color: #b6beb8;
}

.write-preview__body {
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
}

.write-preview__body::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.write-preview__body:hover {
  scrollbar-width: thin;
  scrollbar-color: rgba(224, 181, 73, 0.58) transparent;
}

.write-preview__body:hover::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.write-preview__body::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: transparent;
}

.write-preview__body:hover::-webkit-scrollbar-thumb {
  background: rgba(224, 181, 73, 0.42);
  background-clip: padding-box;
}

.write-preview__body:hover::-webkit-scrollbar-thumb:hover {
  background: rgba(224, 181, 73, 0.7);
}

:global(.el-image-viewer__mask) {
  opacity: 0.88;
}

@media (max-width: 640px) {
  :global(.write-preview-dialog.el-dialog) {
    height: calc(100vh - 32px);
  }

  :global(.write-preview-dialog .el-dialog__body) {
    padding: 0 16px;
  }

  .write-preview__header h1 {
    font-size: 30px;
  }

  .write-preview__meta {
    gap: 8px;
  }

  .write-bottom-visual {
    min-height: 280px;
  }

  .write-bottom-visual p {
    font-size: 30px;
  }
}
</style>
