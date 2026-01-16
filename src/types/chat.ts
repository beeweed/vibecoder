export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  tokenCount?: number;
}

export interface ChatState {
  messages: ChatMessage[];
  isGenerating: boolean;
  abortController: AbortController | null;
  error: string | null;
}
