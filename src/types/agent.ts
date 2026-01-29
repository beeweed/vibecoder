export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'reading'
  | 'writing'
  | 'refactoring'
  | 'executing_tool'
  | 'completed'
  | 'error';

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  action: 'created' | 'updated' | 'deleted' | 'skipped' | 'read';
  filePath: string;
}

export interface AgentState {
  status: AgentStatus;
  currentOperation: string | null;
  currentFile: string | null;
  activityLog: ActivityLogEntry[];
  errorMessage: string | null;
}

export type ToolType = 'read_file' | 'create_file' | 'update_file' | 'delete_file';

export interface ToolExecutionRequest {
  toolName: ToolType;
  arguments: Record<string, unknown>;
}

export interface ToolExecutionResult {
  success: boolean;
  toolName: ToolType;
  data?: unknown;
  error?: string;
}

export interface AgentLoopMessage {
  role: 'user' | 'assistant' | 'tool_result';
  content: string;
  toolName?: ToolType;
  toolResult?: ToolExecutionResult;
}

export interface AgentStreamEvent {
  type: 'token' | 'tool_call' | 'tool_result' | 'file_operation' | 'done' | 'error' | 'loop_iteration';
  content?: string;
  toolCall?: ToolExecutionRequest;
  toolResult?: ToolExecutionResult;
  fileOperation?: {
    type: 'create' | 'update' | 'delete';
    path: string;
    content?: string;
  };
  iteration?: number;
  message?: string;
}
