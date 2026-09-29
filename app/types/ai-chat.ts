export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
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
