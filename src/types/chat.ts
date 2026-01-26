export type MessageRole = 'user' | 'assistant' | 'system';

export interface ThinkingState {
  reasoning: string;
  isStreaming?: boolean;
}

export interface FileOperation {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'skipped';
  filePath: string;
  fileName: string;
  reason?: string; // For skipped operations
}

export interface ToolCallState {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'executing' | 'completed' | 'error';
  result?: {
    success: boolean;
    data?: unknown;
    error?: string;
  };
  startedAt: Date;
  completedAt?: Date;
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
  toolCalls?: ToolCallState[];
}

export interface ChatState {
  messages: ChatMessage[];
  isGenerating: boolean;
  isThinking: boolean;
  abortController: AbortController | null;
  error: string | null;
}
