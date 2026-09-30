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

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  reasoningContent?: string | null;
  reasoningDurationMs?: number | null;
  contentParts?: AiMessageContentPart[];
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
};

export type StreamEvent = {
  type?: 'answer_delta' | 'reasoning_delta' | 'reasoning_done' | 'done' | 'error';
  content?: string;
  reasoningContent?: string;
  reasoningDurationMs?: number;
  code?: string;
  message?: string;
};
