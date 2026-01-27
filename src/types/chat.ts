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

export interface PlanStepDisplay {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error' | 'skipped';
  content?: string;
  isStreaming?: boolean;
  fileOperations?: FileOperation[];
  toolCalls?: ToolCallState[];
  error?: string;
}

export interface AgentPlanDisplay {
  goal: string;
  steps: PlanStepDisplay[];
  isStreaming?: boolean;
  rawContent?: string;
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
  agentPlan?: AgentPlanDisplay;
  completionSummary?: string;
  isCompletionStreaming?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isGenerating: boolean;
  isThinking: boolean;
  abortController: AbortController | null;
  error: string | null;
}
