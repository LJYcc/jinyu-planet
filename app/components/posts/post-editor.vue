<script setup lang="ts">
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor-next/editor';
import '@wangeditor-next/editor/dist/css/style.css';

const props = defineProps<{ modelValue: string; placeholder?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const editorRef = shallowRef<IDomEditor>();

const WangEditor = defineAsyncComponent(async () => (await import('@wangeditor-next/editor-for-vue')).Editor);
const WangToolbar = defineAsyncComponent(async () => (await import('@wangeditor-next/editor-for-vue')).Toolbar);

const editorConfig = computed<Partial<IEditorConfig>>(() => ({
  placeholder: props.placeholder || '写下此刻想被陌生人读到的一点真心...',
  MENU_CONF: {
    uploadImage: { server: '' }
  }
}));
const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: [
    'headerSelect',
    'bold',
    'italic',
    'through',
    '|',
    'blockquote',
    'divider',
    '|',
    'bulletedList',
    'numberedList',
    'todo',
    '|',
    'codeBlock',
    'insertLink',
    '|',
    'undo',
    'redo'
  ]
};

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor;
}

function handleDestroyed() {
  editorRef.value = undefined;
}

function updateValue(value: string) {
  emit('update:modelValue', value);
}

onBeforeUnmount(() => editorRef.value?.destroy());
</script>

<template>
  <div class="post-editor">
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
  min-height: 390px;
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 15px;
  line-height: 1.9;
}

.post-editor :deep([data-slate-editor]) {
  box-sizing: border-box;
  width: 100%;
}

.post-editor :deep(.w-e-text-placeholder) {
  font-style: normal;
}

.post-editor__fallback {
  min-height: 390px;
  padding: 22px;
  color: var(--muted);
}
</style>
