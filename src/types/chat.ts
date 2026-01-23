export type MessageRole = 'user' | 'assistant' | 'system';

export interface ThinkingState {
  reasoning: string;
  isStreaming?: boolean;
}

export interface FileOperation {
  id: string;
  action: 'created' | 'updated' | 'deleted';
  filePath: string;
  fileName: string;
}

export interface FileRead {
  id: string;
  path: string;
  fileName: string;
  status: 'reading' | 'done' | 'error';
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  tokenCount?: number;
  thinking?: ThinkingState;
  wasCancelled?: boolean;
  fileOperations?: FileOperation[];
  fileReads?: FileRead[];
}

export interface ChatState {
  messages: ChatMessage[];
  isGenerating: boolean;
  isThinking: boolean;
  abortController: AbortController | null;
  error: string | null;
}
