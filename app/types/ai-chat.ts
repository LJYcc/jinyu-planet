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
