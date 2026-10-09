<script setup lang="ts">
import { CircleClose, Delete, Edit, Expand, Fold, MoreFilled, Plus, Select, Share, Top } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import moment from 'moment';
import logoLight from '~/assets/logo/goldfish-planet-logo-light-tech.png';
import type { Conversation } from '~/types/ai-chat';

// 侧栏只负责展示会话和收集用户操作，不直接请求后端接口。
// 所有数据修改都通过事件交给父组件，保证页面只有一份业务状态。
const props = defineProps<{
  conversations: Conversation[];
  activeConversationId?: string;
  disabled: boolean;
  isLoading: boolean;
  collapsed: boolean;
  visitorNickname: string;
}>();

const emit = defineEmits<{
  create: [];
  select: [conversationId: string];
  remove: [conversation: Conversation];
  rename: [conversation: Conversation, title: string];
  togglePin: [conversation: Conversation];
  enterMultiSelect: [];
  removeSelected: [conversationIds: string[]];
  pinSelected: [conversationIds: string[]];
  toggleCollapse: [];
}>();

type ConversationGroup = {
  label: string;
  conversations: Conversation[];
};

/** 根据会话更新日期返回普通会话的日期分组标签。 */
function getConversationDateGroupLabel(updatedAt: string, today: moment.Moment) {
  const conversationDate = moment(updatedAt).startOf('day');

  if (conversationDate.isSame(today, 'day')) {
    return '今天';
  }

  if (conversationDate.isSame(today.clone().subtract(1, 'day'), 'day')) {
    return '昨天';
  }

  if (conversationDate.isSameOrAfter(today.clone().subtract(7, 'days'), 'day')) {
    return '7天内';
  }

  if (conversationDate.isSameOrAfter(today.clone().subtract(30, 'days'), 'day')) {
    return '30天内';
  }

  return conversationDate.format('YYYY-MM');
}

// 置顶会话固定在最前；普通会话按相对日期和月份分组，方便浏览不同时间段的历史。
const conversationGroups = computed<ConversationGroup[]>(() => {
  const groups: ConversationGroup[] = [];
  const pinnedConversations = props.conversations.filter(conversation => {
    return conversation.isPinned;
  });
  const regularConversations = props.conversations.filter(conversation => {
    return !conversation.isPinned;
  });

  if (pinnedConversations.length) {
    groups.push({ label: '置顶', conversations: pinnedConversations });
  }

  const today = moment().startOf('day');
  const groupedRegularConversations = new Map<string, Conversation[]>();

  regularConversations.forEach(conversation => {
    const label = getConversationDateGroupLabel(conversation.updatedAt, today);
    const group = groupedRegularConversations.get(label) ?? [];
    group.push(conversation);
    groupedRegularConversations.set(label, group);
  });

  ['今天', '昨天', '7天内', '30天内'].forEach(label => {
    const conversations = groupedRegularConversations.get(label);
    if (conversations?.length) {
      groups.push({ label, conversations });
    }
  });

  // YYYY-MM 使用固定宽度格式，字符串倒序与月份倒序一致。
  Array.from(groupedRegularConversations.entries())
    .filter(([label]) => {
      return !['今天', '昨天', '7天内', '30天内'].includes(label);
    })
    .sort(([firstLabel], [secondLabel]) => {
      return secondLabel.localeCompare(firstLabel);
    })
    .forEach(([label, conversations]) => {
      groups.push({ label, conversations });
    });

  return groups;
});

const historyListRef = ref<HTMLElement>();
const selectedIds = ref<string[]>([]);
const isMultiSelect = computed(() => selectedIds.value.length > 0);
const scrollbarThumbHeight = ref(0);
const scrollbarThumbTop = ref(0);
const isScrollbarVisible = ref(false);
let scrollbarHideTimer: ReturnType<typeof setTimeout> | undefined;
let isDraggingScrollbar = false;
let dragStartY = 0;
let dragStartScrollTop = 0;

function updateScrollbar() {
  const historyList = historyListRef.value;
  if (!historyList) {
    return;
  }

  const { clientHeight, scrollHeight, scrollTop } = historyList;
  if (scrollHeight <= clientHeight) {
    scrollbarThumbHeight.value = 0;
    scrollbarThumbTop.value = 0;
    isScrollbarVisible.value = false;
    return;
  }

  const thumbHeight = Math.max(28, (clientHeight / scrollHeight) * clientHeight);
  const maxThumbTop = clientHeight - thumbHeight;
  const scrollableDistance = scrollHeight - clientHeight;
  scrollbarThumbHeight.value = thumbHeight;
  scrollbarThumbTop.value = (scrollTop / scrollableDistance) * maxThumbTop;
}

function scheduleScrollbarHide() {
  if (scrollbarHideTimer) {
    clearTimeout(scrollbarHideTimer);
  }

  scrollbarHideTimer = setTimeout(() => {
    if (!isDraggingScrollbar) {
      isScrollbarVisible.value = false;
    }
  }, 900);
}

function showScrollbar() {
  updateScrollbar();
  if (scrollbarThumbHeight.value === 0) {
    return;
  }

  isScrollbarVisible.value = true;
  scheduleScrollbarHide();
}

function handleHistoryScroll() {
  showScrollbar();
}

function handleScrollbarPointerDown(event: PointerEvent) {
  const historyList = historyListRef.value;
  if (!historyList || scrollbarThumbHeight.value === 0) {
    return;
  }

  isDraggingScrollbar = true;
  dragStartY = event.clientY;
  dragStartScrollTop = historyList.scrollTop;
  isScrollbarVisible.value = true;
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  event.preventDefault();
}

function handleScrollbarPointerMove(event: PointerEvent) {
  const historyList = historyListRef.value;
  if (!isDraggingScrollbar || !historyList) {
    return;
  }

  const trackHeight = historyList.clientHeight;
  const scrollableDistance = historyList.scrollHeight - trackHeight;
  const thumbTravelDistance = trackHeight - scrollbarThumbHeight.value;
  if (thumbTravelDistance <= 0) {
    return;
  }

  const pointerDistance = event.clientY - dragStartY;
  historyList.scrollTop = dragStartScrollTop + (pointerDistance / thumbTravelDistance) * scrollableDistance;
  updateScrollbar();
}

function stopScrollbarDragging(event: PointerEvent) {
  if (!isDraggingScrollbar) {
    return;
  }

  isDraggingScrollbar = false;
  if (event.currentTarget instanceof HTMLElement && event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  scheduleScrollbarHide();
}

function refreshScrollbar() {
  nextTick(() => {
    updateScrollbar();
  });
}

function toggleSelection(conversationId: string) {
  if (selectedIds.value.includes(conversationId)) {
    selectedIds.value = selectedIds.value.filter(id => {
      return id !== conversationId;
    });
    return;
  }

  selectedIds.value = [...selectedIds.value, conversationId];
}

function clearSelection() {
  selectedIds.value = [];
}

/** 在侧栏内收集和校验新标题；保存共享会话数据仍由父组件处理。 */
async function handleRename(conversation: Conversation) {
  try {
    const result = await ElMessageBox.prompt('请输入新的会话标题。', '重命名会话', {
      inputValue: conversation.title || '新对话',
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputValidator: value => {
        return Boolean(value.trim()) || '标题不能为空。';
      }
    });
    emit('rename', conversation, result.value.trim());
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('重命名操作未完成。');
    }
  }
}

/** 复制当前访客可访问的会话定位链接，不修改任何共享会话状态。 */
async function handleShare(conversation: Conversation) {
  const shareUrl = `${window.location.origin}/ai-chat?conversation=${conversation.id}`;
  try {
    await navigator.clipboard.writeText(shareUrl);
    ElMessage.success('会话链接已复制。');
  } catch {
    ElMessage.error('会话链接复制失败，请稍后重试。');
  }
}

/** 在侧栏完成单个会话的删除确认，再交由父组件处理跨区域状态。 */
async function handleRemove(conversation: Conversation) {
  try {
    await ElMessageBox.confirm(`删除“${conversation.title || '新对话'}”及其全部消息？`, '删除会话', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    });
    emit('remove', conversation);
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('删除确认未完成。');
    }
  }
}

/** 多选状态属于侧栏；确认后将 ID 快照交给父组件批量删除。 */
async function handleRemoveSelected() {
  if (!selectedIds.value.length) {
    return;
  }

  const conversationIds = [...selectedIds.value];
  try {
    await ElMessageBox.confirm(`删除选中的 ${conversationIds.length} 个会话及其全部消息？`, '批量删除会话', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    });
    clearSelection();
    emit('removeSelected', conversationIds);
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('批量删除确认未完成。');
    }
  }
}

function handleMenuCommand(conversation: Conversation, command: string) {
  if (command === 'rename') {
    void handleRename(conversation);
  }

  if (command === 'pin') {
    emit('togglePin', conversation);
  }

  if (command === 'share') {
    void handleShare(conversation);
  }

  if (command === 'multi-select') {
    toggleSelection(conversation.id);
    emit('enterMultiSelect');
  }

  if (command === 'delete') {
    void handleRemove(conversation);
  }
}

function selectConversation(conversationId: string) {
  if (isMultiSelect.value) {
    toggleSelection(conversationId);
    return;
  }

  emit('select', conversationId);
}

watch(() => props.conversations.length, refreshScrollbar, { flush: 'post' });
watch(() => props.collapsed, clearSelection);
onMounted(refreshScrollbar);
onBeforeUnmount(() => {
  if (scrollbarHideTimer) {
    clearTimeout(scrollbarHideTimer);
  }
});
</script>

<template>
  <aside class="ai-conversation-sidebar">
    <header
      v-if="!props.collapsed"
      class="ai-conversation-sidebar__header"
    >
      <nuxt-link
        to="/"
        class="ai-conversation-sidebar__brand"
        aria-label="返回金鱼星球首页"
      >
        <img
          :src="logoLight"
          class="ai-conversation-sidebar__logo"
          alt="金鱼星球"
        />
      </nuxt-link>
      <el-tooltip
        content="折叠侧边栏"
        placement="top"
      >
        <el-button
          :icon="Fold"
          text
          aria-label="折叠侧边栏"
          @click="emit('toggleCollapse')"
        />
      </el-tooltip>
    </header>

    <header
      v-else
      class="ai-conversation-sidebar__collapsed-header"
    >
      <div class="ai-conversation-sidebar__collapsed-actions">
        <el-tooltip
          content="展开侧边栏"
          placement="right"
        >
          <el-button
            :icon="Expand"
            text
            aria-label="展开侧边栏"
            @click="emit('toggleCollapse')"
          />
        </el-tooltip>
      </div>
    </header>

    <template v-if="props.collapsed">
      <div class="ai-conversation-sidebar__collapsed-content">
        <div class="ai-conversation-sidebar__collapsed-actions">
          <el-tooltip
            content="新建对话"
            placement="right"
          >
            <el-button
              :icon="Plus"
              text
              aria-label="新建对话"
              :disabled="props.disabled"
              @click="emit('create')"
            />
          </el-tooltip>
        </div>
      </div>
    </template>

    <template v-else>
      <el-button
        class="ai-conversation-sidebar__create w-full"
        :icon="Plus"
        :disabled="props.disabled"
        @click="emit('create')"
      >
        新建对话
      </el-button>

      <div
        v-if="isMultiSelect"
        class="ai-conversation-sidebar__multi-select-toolbar"
      >
        <el-tooltip
          content="退出多选"
          placement="top"
        >
          <el-button
            :icon="CircleClose"
            text
            aria-label="完成多选"
            @click="clearSelection"
          />
        </el-tooltip>
      </div>

      <div
        class="ai-conversation-sidebar__list-shell"
        @mouseenter="showScrollbar"
        @mouseleave="scheduleScrollbarHide"
      >
        <div
          ref="historyListRef"
          class="ai-conversation-sidebar__list"
          @scroll="handleHistoryScroll"
        >
          <div
            v-if="props.isLoading"
            class="ai-conversation-sidebar__loading"
            role="status"
            aria-label="正在加载历史会话"
          >
            <el-skeleton
              :rows="6"
              style="--el-skeleton-color: rgba(203, 223, 211, 0.1); --el-skeleton-to-color: rgba(203, 223, 211, 0.18)"
              animated
            />
          </div>
          <template
            v-for="group in conversationGroups"
            v-else
            :key="group.label"
          >
            <div class="ai-conversation-sidebar__group-heading">{{ group.label }}</div>
            <div
              v-for="conversation in group.conversations"
              :key="conversation.id"
              class="ai-conversation-sidebar__item"
              :class="{
                'ai-conversation-sidebar__item--active': conversation.id === props.activeConversationId,
                'ai-conversation-sidebar__item--selected': selectedIds.includes(conversation.id)
              }"
            >
              <transition name="ai-conversation-selection">
                <el-checkbox
                  v-if="isMultiSelect"
                  :model-value="selectedIds.includes(conversation.id)"
                  class="ai-conversation-sidebar__checkbox"
                  aria-label="选择会话"
                  @click.stop
                  @change="toggleSelection(conversation.id)"
                />
              </transition>
              <button
                class="ai-conversation-sidebar__conversation-button"
                type="button"
                :disabled="props.disabled"
                @click="selectConversation(conversation.id)"
              >
                <span>{{ conversation.title || '新对话' }}</span>
              </button>
              <el-dropdown
                trigger="click"
                placement="bottom-end"
                :disabled="props.disabled"
                @command="handleMenuCommand(conversation, $event)"
              >
                <el-button
                  class="ai-conversation-sidebar__menu-trigger"
                  text
                  aria-label="会话操作"
                  @click.stop
                >
                  <el-icon><more-filled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      command="rename"
                      :icon="Edit"
                      >重命名</el-dropdown-item
                    >
                    <el-dropdown-item
                      command="pin"
                      :icon="Top"
                    >
                      {{ conversation.isPinned ? '取消置顶' : '置顶' }}
                    </el-dropdown-item>
                    <el-dropdown-item
                      command="share"
                      :icon="Share"
                      >分享</el-dropdown-item
                    >
                    <el-dropdown-item
                      command="multi-select"
                      :icon="Select"
                      >多选</el-dropdown-item
                    >
                    <el-dropdown-item
                      command="delete"
                      :icon="Delete"
                      >删除</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </div>
        <div
          v-if="scrollbarThumbHeight > 0"
          class="ai-conversation-sidebar__scrollbar"
          :class="{ 'ai-conversation-sidebar__scrollbar--visible': isScrollbarVisible }"
          aria-hidden="true"
        >
          <span
            class="ai-conversation-sidebar__scrollbar-thumb"
            :style="{
              height: `${scrollbarThumbHeight}px`,
              transform: `translateY(${scrollbarThumbTop}px)`
            }"
            @pointerdown="handleScrollbarPointerDown"
            @pointermove="handleScrollbarPointerMove"
            @pointerup="stopScrollbarDragging"
            @pointercancel="stopScrollbarDragging"
          />
        </div>
      </div>
    </template>

    <footer
      v-if="!props.collapsed && !isMultiSelect"
      class="ai-conversation-sidebar__visitor"
    >
      {{ props.visitorNickname }}
    </footer>
    <footer
      v-else-if="!props.collapsed"
      class="ai-conversation-sidebar__bulk-actions"
    >
      <el-button
        :icon="Top"
        text
        :disabled="props.disabled"
        @click="
          emit('pinSelected', selectedIds);
          clearSelection();
        "
      >
        置顶
      </el-button>
      <span
        class="ai-conversation-sidebar__bulk-divider"
        aria-hidden="true"
      >
        |
      </span>
      <el-button
        :icon="Delete"
        text
        type="danger"
        :disabled="props.disabled"
        @click="handleRemoveSelected"
      >
        删除
      </el-button>
    </footer>
  </aside>
</template>

<style scoped lang="scss">
.ai-conversation-sidebar {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  padding: 0 10px 10px;
  border: 1px solid rgba(218, 235, 225, 0.2);
  border-radius: 12px;
  background: rgba(5, 22, 25, 0.58);
  box-shadow: 0 22px 58px rgba(1, 9, 11, 0.28);
}

.ai-conversation-sidebar__header,
.ai-conversation-sidebar__collapsed-header {
  display: flex;
  height: 48px;
  flex: 0 0 48px;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  border-bottom: 1px solid rgba(218, 235, 225, 0.14);
}

.ai-conversation-sidebar__logo {
  display: block;
  width: 148px;
  height: 40px;
  object-fit: contain;
  object-position: left center;
}

.ai-conversation-sidebar__brand {
  display: block;
  min-width: 0;
  border-radius: 6px;
}

.ai-conversation-sidebar__brand:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.ai-conversation-sidebar__header :deep(.el-button) {
  width: 32px;
  height: 32px;
  margin: 0;
  color: #c8d7cf;
}

.ai-conversation-sidebar__header :deep(.el-button:hover) {
  color: var(--accent);
  background: transparent;
}

.ai-conversation-sidebar__collapsed-header {
  justify-content: center;
}

.ai-conversation-sidebar__collapsed-actions {
  display: grid;
  width: 36px;
  height: 36px;
  padding: 1px;
  border: 1px solid rgba(218, 235, 225, 0.24);
  border-radius: 8px;
  transition:
    border-color 180ms ease,
    background-color 180ms ease;
}

.ai-conversation-sidebar__collapsed-content {
  display: flex;
  justify-content: center;
  padding-top: 18px;
}

.ai-conversation-sidebar__collapsed-actions :deep(.el-button) {
  width: 32px;
  height: 32px;
  margin: 0;
  color: #c8d7cf;
}

.ai-conversation-sidebar__collapsed-actions:hover,
.ai-conversation-sidebar__collapsed-actions:focus-within {
  border-color: var(--accent);
  background: rgba(224, 181, 73, 0.16);
}

.ai-conversation-sidebar__collapsed-actions :deep(.el-button:hover),
.ai-conversation-sidebar__collapsed-actions :deep(.el-button:focus-visible) {
  color: var(--accent);
  background: transparent;
  box-shadow: none;
}

.ai-conversation-sidebar__create {
  flex: 0 0 42px;
  margin: 14px 0 12px;
  border-color: rgba(239, 246, 240, 0.66);
  color: #f5f7f1;
  background: transparent;
  border-radius: 16px;
}

.ai-conversation-sidebar__create:hover,
.ai-conversation-sidebar__create:focus-visible {
  border-color: var(--accent);
  color: var(--night);
  background: var(--accent);
}

.ai-conversation-sidebar__multi-select-toolbar {
  display: flex;
  height: 30px;
  align-items: center;
  justify-content: flex-end;
}

.ai-conversation-sidebar__multi-select-toolbar :deep(.el-button) {
  width: 32px;
  min-height: 32px;
  margin: 0;
  padding: 4px;
  color: var(--accent);
}

.ai-conversation-sidebar__multi-select-toolbar :deep(.el-button .el-icon) {
  font-size: 20px;
}

.ai-conversation-sidebar__multi-select-toolbar :deep(.el-button:hover),
.ai-conversation-sidebar__multi-select-toolbar :deep(.el-button:focus-visible) {
  color: var(--accent);
  background: rgba(224, 181, 73, 0.18);
  box-shadow: inset 0 0 0 1px rgba(224, 181, 73, 0.42);
}

.ai-conversation-sidebar__group-heading {
  min-height: 38px;
  padding: 13px 4px 5px;
  color: #9db3a9;
  font-size: 12px;
  line-height: 1.2;
}

.ai-conversation-sidebar__group-heading:not(:first-child) {
  margin-top: 8px;
  border-top: 1px solid rgba(218, 235, 225, 0.12);
}

.ai-conversation-sidebar__list-shell {
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  margin-bottom: 12px;
  overflow: visible;
}

.ai-conversation-sidebar__list {
  display: grid;
  width: 100%;
  height: 100%;
  align-content: start;
  grid-auto-rows: max-content;
  min-height: 0;
  gap: 4px;
  overflow-y: auto;
  scrollbar-width: none;
}

.ai-conversation-sidebar__list::-webkit-scrollbar {
  display: none;
}

.ai-conversation-sidebar__loading {
  padding: 10px 6px;
}

.ai-conversation-sidebar__scrollbar {
  position: absolute;
  z-index: 1;
  top: 4px;
  right: -10px;
  bottom: 4px;
  width: 5px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 180ms ease;
}

.ai-conversation-sidebar__scrollbar--visible {
  pointer-events: auto;
  opacity: 1;
}

.ai-conversation-sidebar__scrollbar-thumb {
  display: block;
  width: 100%;
  min-height: 28px;
  border-radius: 999px;
  background: rgba(224, 181, 73, 0.58);
  cursor: grab;
  touch-action: none;
}

.ai-conversation-sidebar__item {
  display: flex;
  width: 100%;
  min-height: 40px;
  min-width: 0;
  align-items: center;
  border-radius: 12px;
}

.ai-conversation-sidebar__item--active,
.ai-conversation-sidebar__item:hover {
  background: rgba(224, 181, 73, 0.1);
}

.ai-conversation-sidebar__checkbox {
  flex: 0 0 auto;
  margin: 0 5px 0 2px;
}

.ai-conversation-sidebar__conversation-button {
  display: flex;
  flex: 1 1 auto;
  width: 0;
  min-width: 0;
  align-items: center;
  gap: 6px;
  padding: 8px 6px;
  overflow: hidden;
  color: #dce8df;
  font: inherit;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.ai-conversation-sidebar__conversation-button span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-conversation-sidebar__conversation-button:hover,
.ai-conversation-sidebar__conversation-button:focus-visible {
  color: var(--accent);
}

.ai-conversation-sidebar__item :deep(.el-dropdown) {
  width: 32px;
  flex: 0 0 32px;
  display: flex;
}

.ai-conversation-sidebar__item :deep(.el-button) {
  width: 32px;
  min-height: 30px;
  flex: 0 0 32px;
  margin: 0;
  padding: 5px;
  color: #a9bbb2;
}

.ai-conversation-sidebar__menu-trigger :deep(.el-icon) {
  display: inline-flex;
  color: inherit;
  font-size: 16px;
  visibility: visible;
}

.ai-conversation-sidebar__item :deep(.el-button:hover),
.ai-conversation-sidebar__item :deep(.el-button:focus-visible) {
  color: var(--accent);
  background: transparent;
}

.ai-conversation-sidebar__bulk-actions {
  display: grid;
  align-items: center;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  padding: 10px 2px 0;
  border-top: 1px solid rgba(218, 235, 225, 0.14);
  gap: 10px;
}

.ai-conversation-sidebar__visitor {
  flex: 0 0 40px;
  overflow: hidden;
  padding: 12px 4px;
  border-top: 1px solid rgba(218, 235, 225, 0.14);
  color: #a9bbb2;
  font-size: 13px;
  line-height: 16px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-conversation-sidebar__bulk-actions :deep(.el-button) {
  width: 100%;
  margin: 0;
  padding: 6px 8px;
}

.ai-conversation-sidebar__bulk-divider {
  flex: 0 0 auto;
  color: rgba(218, 235, 225, 0.38);
  font-size: 16px;
  line-height: 1;
}

.ai-conversation-selection-enter-active,
.ai-conversation-selection-leave-active {
  overflow: hidden;
  transition:
    width 180ms ease,
    opacity 180ms ease,
    margin 180ms ease;
}

.ai-conversation-selection-enter-from,
.ai-conversation-selection-leave-to {
  width: 0;
  margin-right: 0;
  opacity: 0;
}

@media (max-width: 900px) {
  .ai-conversation-sidebar {
    min-height: 220px;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
}
</style>
