<script setup lang="ts">
/**
 * AI Chat 页面控制器。
 *
 * 这里集中管理当前会话、历史会话、消息流和请求状态；子组件只负责界面展示，
 * 通过 props 接收数据，并通过 emits 把用户操作交回本组件处理。
 */
import { ElMessage, ElMessageBox } from 'element-plus';
import { v4 as uuidv4 } from 'uuid';
import { useVisitor } from '~/composables/useVisitor';
import AiConversationSidebar from '~/components/ai-chat/ai-conversation-sidebar.vue';
import AiNewConversation from '~/components/ai-chat/ai-new-conversation.vue';
import {
  createAiConversation,
  deleteAiConversation,
  listAiConversationMessages,
  listAiConversations,
  streamAiConversationMessage,
  updateAiConversation
} from '~/services/ai-conversation-api';
import type { ChatMessage, ChatRole, Conversation, StreamEvent } from '~/types/ai-chat';

// 这个组件是 AI 聊天的控制器：负责会话、请求、流式解析和错误状态。
// 视觉展示与输入交互分别交给三个子组件，避免把业务流程和页面结构混在一起。
type ApiErrorPayload = {
  code?: string;
  message?: string;
};

const TYPEWRITER_CHARACTER_DELAY_MS = 28;

const { bootstrap, visitor } = useVisitor();
const route = useRoute();
const router = useRouter();
const messages = ref<ChatMessage[]>([]);
const conversations = ref<Conversation[]>([]);
const conversationId = ref<string>();
const input = ref('');
const isLoadingConversations = ref(true);
const isLoadingHistory = ref(false);
const isSending = ref(false);
const requestError = ref('');
const lastFailedMessage = ref('');
const lastFailedNonce = ref('');
const typingMessageId = ref<string>();
const loadingConversationTitle = ref<string>();
const isSidebarCollapsed = ref(false);
let abortController: AbortController | undefined;
let requestSequence = 0;

const currentConversation = computed(() => {
  return conversations.value.find(item => {
    return item.id === conversationId.value;
  });
});
const conversationTitle = computed(() => {
  return currentConversation.value?.title || '新对话';
});
const hasConversationQuery = computed(() => {
  return route.query.conversation !== undefined;
});
const isLoadingContent = computed(() => {
  return isLoadingHistory.value || (isLoadingConversations.value && hasConversationQuery.value);
});

// 没有会话 ID 且消息列表为空，表示访客正处于延迟创建的新对话状态。
const isNewConversation = computed(() => {
  return !isLoadingContent.value && !conversationId.value && messages.value.length === 0;
});

/** 创建一个带前端 ID 的消息对象，用于立即更新消息列表。 */
function createMessage(role: ChatRole, content: string, createdAt?: string): ChatMessage {
  return {
    id: uuidv4(),
    role,
    content,
    createdAt
  };
}

/** 将服务端错误转换为用户可以理解的提示文字。 */
function getApiError(error: unknown) {
  const payload = (error as { data?: ApiErrorPayload }).data;
  if (payload?.code === 'AI_SERVICE_NOT_CONFIGURED') {
    return 'AI 服务尚未配置，因此没有生成回复。';
  }

  if (payload?.code === 'AI_PROVIDER_CREDITS_REQUIRED') {
    return 'AI 服务当前没有可用额度。';
  }

  if (payload?.code === 'AI_PROVIDER_AUTH_FAILED') {
    return 'AI 服务鉴权失败，请检查服务端配置。';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return payload?.message || '请求没有完成，请检查网络后重试。';
}

/** 更新当前会话 ID；没有 ID 表示页面处于延迟创建的新对话状态。 */
function setConversationId(id?: string) {
  conversationId.value = id;
}

/** 读取指定历史会话的消息，并将其设为当前会话。 */
async function loadConversation(id: string, title?: string) {
  isLoadingHistory.value = true;
  loadingConversationTitle.value = title;
  requestError.value = '';
  try {
    const conversationMessages = await listAiConversationMessages(id);
    setConversationId(id);
    messages.value = conversationMessages;
    return true;
  } catch (error) {
    requestError.value = getApiError(error);
    return false;
  } finally {
    isLoadingHistory.value = false;
    loadingConversationTitle.value = undefined;
  }
}

/** 从 URL 查询参数中读取单个会话 ID；其他格式仍按普通的新对话页面处理。 */
function getConversationIdFromQuery() {
  const conversation = route.query.conversation;
  return typeof conversation === 'string' ? conversation : undefined;
}

/** 同步当前会话到地址栏；没有会话时恢复为新对话地址。 */
async function updateConversationQuery(id?: string) {
  const nextQuery = { ...route.query };
  if (id) {
    nextQuery.conversation = id;
  } else {
    delete nextQuery.conversation;
  }

  if (route.query.conversation === id) {
    return;
  }

  await router.replace({
    path: route.path,
    query: nextQuery,
    hash: route.hash
  });
}

/**
 * 初始化会话列表。
 *
 * 访问带会话参数的地址且会话属于当前匿名访客时，读取该会话的历史消息；
 * 不存在、格式不正确或无权访问的会话参数会被移除，并回到新对话。归属校验仍由会话列表和服务端接口共同保障。
 */
async function loadConversations() {
  let requestedConversationId: string | undefined;
  let requestedConversation: Conversation | undefined;

  isLoadingConversations.value = true;
  try {
    conversations.value = await listAiConversations();
    messages.value = [];
    setConversationId();

    requestedConversationId = getConversationIdFromQuery();
    requestedConversation = conversations.value.find(conversation => {
      return conversation.id === requestedConversationId;
    });
  } finally {
    isLoadingConversations.value = false;
  }

  if (requestedConversationId && requestedConversation) {
    await loadConversation(requestedConversationId, requestedConversation.title || '新对话');
    return;
  }

  if (hasConversationQuery.value) {
    await updateConversationQuery();
  }
}

/** 首次发送消息前创建数据库会话，避免点击“新建对话”产生空记录。 */
async function ensureConversation() {
  if (conversationId.value) {
    return conversationId.value;
  }

  // “新建对话”只是清空页面。只有发送第一条内容时才创建数据库会话，避免留下空记录。
  const conversation = await createAiConversation();
  conversations.value = [conversation, ...conversations.value];
  setConversationId(conversation.id);
  await updateConversationQuery(conversation.id);
  return conversation.id;
}

/** 使用首条用户消息临时更新标题，让侧栏无需刷新即可显示标题。 */
function updateConversationTitle(currentConversationId: string, firstMessage: string) {
  const conversation = conversations.value.find(item => {
    return item.id === currentConversationId;
  });

  if (!conversation || conversation.title) {
    return;
  }

  // 服务端也使用首条 user 消息的前 160 个字符作为标题，前端同步更新避免等待刷新。
  conversation.title = firstMessage.slice(0, 160);
}

/** 用服务端返回的完整会话替换本地数据，并保持置顶排序。 */
function replaceConversation(updatedConversation: Conversation) {
  conversations.value = conversations.value.map(conversation => {
    return conversation.id === updatedConversation.id ? updatedConversation : conversation;
  });
  sortConversationList();
}

/** 置顶会话优先，其余会话按最近更新时间倒序排列。 */
function sortConversationList() {
  conversations.value.sort((first, second) => {
    if (first.isPinned !== second.isPinned) {
      return first.isPinned ? -1 : 1;
    }

    return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
  });
}

/** 保存内容区行内编辑后的会话标题。 */
async function saveConversationTitle(title: string) {
  if (!conversationId.value || title === conversationTitle.value) {
    return;
  }

  try {
    const updatedConversation = await updateAiConversation(conversationId.value, { title });
    replaceConversation(updatedConversation);
    ElMessage.success('标题已更新。');
  } catch (error) {
    requestError.value = getApiError(error);
  }
}

/** 通过弹窗重命名侧栏中的会话。 */
async function renameConversation(conversation: Conversation) {
  try {
    const result = await ElMessageBox.prompt('请输入新的会话标题。', '重命名会话', {
      inputValue: conversation.title || '新对话',
      confirmButtonText: '保存',
      cancelButtonText: '取消',
      inputValidator: value => {
        return Boolean(value.trim()) || '标题不能为空。';
      }
    });
    const updatedConversation = await updateAiConversation(conversation.id, { title: result.value.trim() });
    replaceConversation(updatedConversation);
    ElMessage.success('标题已更新。');
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      requestError.value = getApiError(error);
    }
  }
}

/** 切换单个会话的置顶状态。 */
async function togglePinConversation(conversation: Conversation) {
  try {
    const updatedConversation = await updateAiConversation(conversation.id, { isPinned: !conversation.isPinned });
    replaceConversation(updatedConversation);
  } catch (error) {
    requestError.value = getApiError(error);
  }
}

/** 复制会话链接；实际分享权限仍由服务端和页面路由决定。 */
async function shareConversation(conversation: Conversation) {
  const shareUrl = `${window.location.origin}/ai-chat?conversation=${conversation.id}`;
  try {
    await navigator.clipboard.writeText(shareUrl);
    ElMessage.success('会话链接已复制。');
  } catch (error) {
    requestError.value = getApiError(error);
  }
}

/** 确认并批量删除选中的会话，必要时返回新对话页面。 */
async function removeSelectedConversations(conversationIds: string[]) {
  if (!conversationIds.length) {
    return;
  }

  try {
    await ElMessageBox.confirm(`删除选中的 ${conversationIds.length} 个会话及其全部消息？`, '批量删除会话', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    });
    await Promise.all(
      conversationIds.map(id => {
        return deleteAiConversation(id);
      })
    );
    conversations.value = conversations.value.filter(conversation => {
      return !conversationIds.includes(conversation.id);
    });
    if (conversationId.value && conversationIds.includes(conversationId.value)) {
      await startNewConversation();
    }
    ElMessage.success('选中的会话已删除。');
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      requestError.value = getApiError(error);
    }
  }
}

/** 将选中的多个会话批量置顶，并同步更新本地列表。 */
async function pinSelectedConversations(conversationIds: string[]) {
  if (!conversationIds.length) {
    return;
  }

  try {
    const updatedConversations = await Promise.all(
      conversationIds.map(id => {
        return updateAiConversation(id, { isPinned: true });
      })
    );
    updatedConversations.forEach(updatedConversation => {
      replaceConversation(updatedConversation);
    });
    ElMessage.success('选中的会话已置顶。');
  } catch (error) {
    requestError.value = getApiError(error);
  }
}

/** 从 SSE 错误事件中提取可展示的错误信息。 */
function parseStreamError(event: StreamEvent) {
  if (event.message) {
    return event.message;
  }

  return 'AI 服务没有完成本次回答。';
}

/** 为逐字渲染提供一个可配置的字符间隔。 */
function waitForTypewriterDelay() {
  return new Promise(resolve => {
    window.setTimeout(resolve, TYPEWRITER_CHARACTER_DELAY_MS);
  });
}

/** 将一个流式片段按 Unicode 字符逐个追加到 assistant 消息。 */
async function appendTypewriterDelta(content: string, assistantMessage: ChatMessage, signal: AbortSignal) {
  // Array.from 按 Unicode 字符遍历，不会把 emoji 等字符拆成无效的 UTF-16 片段。
  for (const character of Array.from(content)) {
    if (signal.aborted) {
      throw new DOMException('The AI request was stopped.', 'AbortError');
    }

    assistantMessage.content += character;
    // 每个字符让出一个定时器周期，使 Vue 和浏览器有机会完成一次可见绘制。
    await waitForTypewriterDelay();
  }
}

/** 读取服务端 SSE 响应，解析 delta、error 和 done 事件。 */
async function consumeStream(response: Response, assistantMessage: ChatMessage, signal: AbortSignal) {
  if (!response.body) {
    throw new Error('AI response body is empty.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      // SSE 的一个网络分块可能包含半条或多条事件，因此按换行切分并保留残缺尾部。
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data:')) {
          continue;
        }

        const data = line.slice(5).trim();
        if (!data) {
          continue;
        }

        const streamEvent = JSON.parse(data) as StreamEvent;
        if (streamEvent.type === 'delta' && streamEvent.content) {
          await appendTypewriterDelta(streamEvent.content, assistantMessage, signal);
        }

        if (streamEvent.type === 'error') {
          throw new Error(parseStreamError(streamEvent));
        }

        if (streamEvent.type === 'done') {
          return;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** 发送当前消息，负责幂等 nonce、乐观更新、流式渲染和失败回滚。 */
async function requestReply(content: string, isRetry = false) {
  const message = content.trim();
  if (!message || isSending.value || isLoadingHistory.value) {
    return;
  }

  let id: string;
  try {
    id = await ensureConversation();
  } catch (error) {
    requestError.value = getApiError(error);
    return;
  }

  const clientNonce = isRetry && lastFailedNonce.value ? lastFailedNonce.value : uuidv4();
  if (!isRetry) {
    // 先乐观显示用户消息；标题规则与服务端一致，因而可以立即更新而不必等待刷新。
    messages.value.push(createMessage('user', message));
    updateConversationTitle(id, message);
  }

  input.value = '';
  requestError.value = '';
  lastFailedMessage.value = message;
  lastFailedNonce.value = clientNonce;
  isSending.value = true;
  const currentRequest = ++requestSequence;
  const currentAbortController = new AbortController();
  abortController = currentAbortController;

  // 后续逐字修改必须作用于 Vue 的 reactive 对象，模板才能在每个字符到达时更新。
  const assistantMessage = reactive<ChatMessage>(createMessage('assistant', ''));
  messages.value.push(assistantMessage);
  typingMessageId.value = assistantMessage.id;

  try {
    const response = await streamAiConversationMessage(id, message, clientNonce, currentAbortController.signal);

    if (!response.ok) {
      const responsePayload = await response.json().catch(() => {
        return undefined;
      });
      const payload = responsePayload as ApiErrorPayload | undefined;
      const error = Object.assign(new Error(payload?.message || 'AI 请求失败。'), {
        data: payload
      });
      throw error;
    }

    await consumeStream(response, assistantMessage, currentAbortController.signal);
    if (currentRequest !== requestSequence) {
      return;
    }

    if (!assistantMessage.content.trim()) {
      throw new Error('AI 没有返回可显示的内容。');
    }

    lastFailedMessage.value = '';
    lastFailedNonce.value = '';
  } catch (error) {
    const isStopped = currentAbortController.signal.aborted;
    if (currentRequest !== requestSequence) {
      return;
    }

    messages.value = messages.value.filter(messageItem => {
      return messageItem.id !== assistantMessage.id;
    });

    if (isStopped) {
      requestError.value = '已停止本次请求，尚未保存 AI 回复。';
    } else {
      requestError.value = getApiError(error);
    }
  } finally {
    if (currentRequest === requestSequence) {
      isSending.value = false;
      abortController = undefined;
      typingMessageId.value = undefined;
    }
  }
}

/** 发送输入框中的新消息。 */
async function sendMessage() {
  await requestReply(input.value);
}

/** 使用相同 nonce 重试上一次失败的消息。 */
async function retryLastMessage() {
  await requestReply(lastFailedMessage.value, true);
}

/** 中止当前 AI 请求；已生成的临时 assistant 内容不会伪装成完整回答。 */
function stopGenerating() {
  if (abortController) {
    abortController.abort();
  }
}

/** 清空当前页面并进入未保存的新对话状态。 */
async function startNewConversation() {
  requestSequence += 1;
  stopGenerating();
  isSending.value = false;
  messages.value = [];
  input.value = '';
  requestError.value = '';
  lastFailedMessage.value = '';
  lastFailedNonce.value = '';
  typingMessageId.value = undefined;
  setConversationId();
  await updateConversationQuery();
}

/** 切换历史会话成功后，将当前会话 ID 保留在地址栏，刷新时可恢复该会话。 */
async function selectConversation(id: string) {
  const conversation = conversations.value.find(item => {
    return item.id === id;
  });
  const hasLoadedConversation = await loadConversation(id, conversation?.title || '新对话');
  if (hasLoadedConversation) {
    await updateConversationQuery(id);
  }
}

/** 确认并删除单个会话，删除当前会话后回到新对话页面。 */
async function deleteConversation(conversation: Conversation) {
  try {
    await ElMessageBox.confirm(`删除“${conversation.title || '新对话'}”及其全部消息？`, '删除会话', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    });
    await deleteAiConversation(conversation.id);
    conversations.value = conversations.value.filter(item => {
      return item.id !== conversation.id;
    });

    if (conversation.id === conversationId.value) {
      await startNewConversation();
    }

    ElMessage.success('会话已删除。');
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      requestError.value = getApiError(error);
    }
  }
}

/** 将推荐问题填入输入框，等待用户确认发送。 */
function useSuggestion(suggestion: string) {
  input.value = suggestion;
}

onMounted(async () => {
  try {
    await bootstrap();
    await loadConversations();
  } catch (error) {
    requestError.value = getApiError(error);
  }
});

onBeforeUnmount(stopGenerating);
</script>

<template>
  <section
    class="ai-chat-panel"
    :class="{ 'ai-chat-panel--sidebar-collapsed': isSidebarCollapsed }"
  >
    <!-- 子组件只通过 props 展示状态、通过事件把用户操作交回控制器。 -->
    <ai-conversation-sidebar
      :conversations="conversations"
      :active-conversation-id="conversationId"
      :disabled="isSending || isLoadingConversations || isLoadingHistory"
      :is-loading="isLoadingConversations"
      :collapsed="isSidebarCollapsed"
      :visitor-nickname="visitor?.nickname || '匿名访客'"
      @create="startNewConversation"
      @select="selectConversation"
      @remove="deleteConversation"
      @rename="renameConversation"
      @toggle-pin="togglePinConversation"
      @share="shareConversation"
      @remove-selected="removeSelectedConversations"
      @pin-selected="pinSelectedConversations"
      @toggle-collapse="isSidebarCollapsed = !isSidebarCollapsed"
    />

    <div class="ai-chat-panel__main">
      <ai-new-conversation
        v-if="isNewConversation"
        v-model="input"
        :is-sending="isSending"
        :disabled="isLoadingConversations"
        :request-error="requestError"
        :can-retry="Boolean(lastFailedMessage)"
        @send="sendMessage"
        @stop="stopGenerating"
        @retry="retryLastMessage"
        @use-suggestion="useSuggestion"
      />
      <template v-else>
        <ai-chat-content
          :conversation-title="conversationTitle"
          :messages="messages"
          :is-loading-conversations="isLoadingConversations"
          :is-loading-content="isLoadingContent"
          :loading-conversation-title="loadingConversationTitle"
          :is-sending="isSending"
          :request-error="requestError"
          :can-retry="Boolean(lastFailedMessage)"
          :typing-message-id="typingMessageId"
          @rename="saveConversationTitle"
          @retry="retryLastMessage"
        />
        <ai-chat-composer
          v-model="input"
          :is-sending="isSending"
          :disabled="isLoadingConversations || isLoadingHistory"
          @send="sendMessage"
          @stop="stopGenerating"
        />
      </template>
    </div>
  </section>
</template>

<style scoped lang="scss">
.ai-chat-panel {
  display: grid;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #f6f7f0;
  gap: 5px;
  grid-template-columns: 250px minmax(0, 1fr);
  transition: grid-template-columns 220ms ease;
}

.ai-chat-panel--sidebar-collapsed {
  grid-template-columns: 66px minmax(0, 1fr);
}

.ai-chat-panel__main {
  display: flex;
  min-height: 0;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(218, 235, 225, 0.2);
  border-radius: 12px;
  background: rgba(4, 20, 24, 0.58);
  box-shadow: 0 22px 58px rgba(1, 9, 11, 0.28);
}

@media (max-width: 900px) {
  .ai-chat-panel {
    grid-template-rows: auto minmax(0, 1fr);
    grid-template-columns: 1fr;
  }

  .ai-chat-panel--sidebar-collapsed {
    grid-template-columns: 1fr;
  }
}
</style>
