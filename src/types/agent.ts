export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'planning'
  | 'reading'
  | 'writing'
  | 'executing'
  | 'refactoring'
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
