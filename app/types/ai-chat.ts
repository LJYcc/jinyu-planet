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

export type StreamEvent = {
  type?: 'delta' | 'done' | 'error';
  content?: string;
  code?: string;
  message?: string;
};
