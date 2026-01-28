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

// Agent Loop Types - for multi-call tool-based agent
export interface AgentThoughtBlock {
  id: string;
  thought: string;
  isStreaming?: boolean;
  timestamp: Date;
}

export interface AgentActionBlock {
  id: string;
  type: 'tool_call' | 'file_operation' | 'response';
  thought?: string; // Short reasoning before action
  thoughtStreaming?: boolean;
  toolCall?: ToolCallState;
  fileOperation?: FileOperation;
  response?: string;
  responseStreaming?: boolean;
  isComplete?: boolean;
  timestamp: Date;
}

export interface AgentLoopState {
  isActive: boolean;
  currentIteration: number;
  maxIterations: number;
  actions: AgentActionBlock[];
  isComplete: boolean;
  finalResponse?: string;
  finalResponseStreaming?: boolean;
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
  // Agent Loop - for multi-call tool execution
  agentLoop?: AgentLoopState;
}

export interface ChatState {
  messages: ChatMessage[];
  isGenerating: boolean;
  isThinking: boolean;
  abortController: AbortController | null;
  error: string | null;
}
