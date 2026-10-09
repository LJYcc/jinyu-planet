export type ChatRole = 'user' | 'assistant';

export type AiMessageContentPart =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'markdown';
      markdown: string;
    };

export type AiAttachment = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export type PendingAiAttachment = AiAttachment & {
  status: 'uploading' | 'uploaded' | 'failed';
  error?: string;
  previewUrl?: string;
  // File 只存在当前浏览器内存，用于上传失败后的重新上传；不会进入消息 API 或历史数据。
  file?: File;
};

export type AiSearchSource = {
  id: string;
  title: string;
  url: string;
  snippet?: string;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  reasoningContent?: string | null;
  reasoningDurationMs?: number | null;
  contentParts?: AiMessageContentPart[];
  attachments?: AiAttachment[];
  searchSources?: AiSearchSource[];
  searchStatus?: 'searching' | 'completed';
  createdAt?: string;
};

export type Conversation = {
  id: string;
  title: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AiCapabilities = {
  deepThinking: boolean;
  webSearch: boolean;
};

export type StreamEvent = {
  type?: 'answer_delta' | 'reasoning_delta' | 'reasoning_done' | 'search_started' | 'search_results' | 'done' | 'error';
  content?: string;
  reasoningContent?: string;
  reasoningDurationMs?: number;
  code?: string;
  message?: string;
  sources?: AiSearchSource[];
};
