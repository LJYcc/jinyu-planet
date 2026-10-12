<script setup lang="ts">
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor-next/editor';
import '@wangeditor-next/editor/dist/css/style.css';
import { uploadPostBodyImage } from '~/services/file-upload-api';

const props = defineProps<{ modelValue: string; placeholder?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string]; 'image-uploaded': [assetId: string] }>();
const editorRef = shallowRef<IDomEditor>();
let viewportBeforeEdit: { left: number; top: number } | null = null;
let restoreScrollFrame: number | undefined;

const WangEditor = defineAsyncComponent(async () => (await import('@wangeditor-next/editor-for-vue')).Editor);
const WangToolbar = defineAsyncComponent(async () => (await import('@wangeditor-next/editor-for-vue')).Toolbar);

const editorConfig = computed<Partial<IEditorConfig>>(() => ({
  placeholder: props.placeholder || '写下此刻想被陌生人读到的一点真心...',
  MENU_CONF: {
    uploadImage: {
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxFileSize: 20 * 1024 * 1024,
      customUpload: async (file: File, insertFn: (url: string, alt: string, href: string) => void) => {
        try {
          const image = await uploadPostBodyImage(file);
          emit('image-uploaded', image.id);
          insertFn(`/api/uploads/${image.id}`, image.originalName, '');
        } catch {
          ElMessage.error('图片上传失败，请稍后重试。');
        }
      }
    },
    insertVideo: {
      checkVideo: (source: string) => {
        try {
          const url = new URL(source);
          return url.protocol === 'http:' || url.protocol === 'https:' ? true : '请使用 HTTP 或 HTTPS 视频地址。';
        } catch {
          return '请输入有效的视频地址。';
        }
      }
    }
  }
}));
const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: [
    'headerSelect',
    'blockquote',
    '|',
    'bold',
    'underline',
    'italic',
    'through',
    '|',
    'wavyUnderline',
    'emphasisDot',
    'code',
    'sup',
    'sub',
    'clearStyle',
    '|',
    'color',
    'bgColor',
    '|',
    'fontSize',
    'fontFamily',
    'lineHeight',
    '|',
    'bulletedList',
    'numberedList',
    'todo',
    '|',
    'justifyLeft',
    'justifyCenter',
    'justifyRight',
    'justifyJustify',
    '|',
    'indent',
    'delIndent',
    '|',
    'emotion',
    'insertLink',
    'insertImage',
    'uploadImage',
    'insertVideo',
    'insertTable',
    'codeBlock',
    'codeSelectLang',
    'divider',
    '|',
    'undo',
    'redo',
    'formatPainter',
    'fullScreen'
  ]
};

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor;
}

function handleDestroyed() {
  editorRef.value = undefined;
}

function rememberPageScroll() {
  viewportBeforeEdit = { left: window.scrollX, top: window.scrollY };
}

function updateValue(value: string) {
  const viewport = viewportBeforeEdit ?? { left: window.scrollX, top: window.scrollY };
  viewportBeforeEdit = null;
  emit('update:modelValue', value);
  nextTick(() => {
    if (restoreScrollFrame) cancelAnimationFrame(restoreScrollFrame);
    restoreScrollFrame = requestAnimationFrame(() => window.scrollTo(viewport));
  });
}

onBeforeUnmount(() => {
  editorRef.value?.destroy();
  if (restoreScrollFrame) cancelAnimationFrame(restoreScrollFrame);
});
</script>

<template>
  <div
    class="post-editor"
    @beforeinput.capture="rememberPageScroll"
  >
    <client-only>
      <wang-toolbar
        class="post-editor__toolbar"
        :editor="editorRef"
        :default-config="toolbarConfig"
        mode="default"
      />
      <wang-editor
        :model-value="props.modelValue"
        :default-config="editorConfig"
        mode="default"
        @update:model-value="updateValue"
        @on-created="handleCreated"
        @on-destroyed="handleDestroyed"
      />
      <template #fallback>
        <div class="post-editor__fallback">编辑器正在准备中...</div>
      </template>
    </client-only>
  </div>
</template>

<style scoped lang="scss">
.post-editor {
  width: 100%;
  min-width: 0;
  overflow: hidden;
  overflow-anchor: none;
  border: 1px solid var(--line);
  background: #fff;
}

.post-editor__toolbar {
  width: 100%;
  border-bottom: 1px solid var(--line);
  background: #fbfcf8;
}

.post-editor :deep(.w-e-toolbar),
.post-editor :deep(.w-e-text-container),
.post-editor :deep(.w-e-scroll) {
  width: 100%;
  min-width: 0;
}

.post-editor :deep(.w-e-text-container) {
  height: 390px;
  min-height: 0;
}

.post-editor :deep(.w-e-scroll) {
  overflow-y: auto;
}

.post-editor :deep([data-slate-editor]) {
  box-sizing: border-box;
  width: 100%;
}

.post-editor :deep(.w-e-text-placeholder) {
  top: 10px;
  color: #a4aaa9;
  font-style: normal;
  font-weight: 400;
}

.post-editor__fallback {
  height: 390px;
  padding: 22px;
  color: var(--muted);
}
</style>
