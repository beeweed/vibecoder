export type AgentPhase = 
  | 'idle'
  | 'thinking'
  | 'planning'
  | 'executing'
  | 'completed'
  | 'error';

export interface PlanStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error' | 'skipped';
  result?: string;
  filesCreated?: string[];
  filesUpdated?: string[];
  filesDeleted?: string[];
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AgentPlan {
  id: string;
  goal: string;
  steps: PlanStep[];
  createdAt: Date;
  status: 'pending' | 'executing' | 'completed' | 'error';
  currentStepIndex: number;
}

export interface AgentLoopState {
  phase: AgentPhase;
  plan: AgentPlan | null;
  thinking: string;
  isThinkingStreaming: boolean;
  isPlanningStreaming: boolean;
  isExecutingStep: boolean;
  currentStepId: string | null;
  completionSummary: string | null;
  error: string | null;
  abortController: AbortController | null;
}

export interface AgentMessage {
  id: string;
  type: 'thinking' | 'planning' | 'step_execution' | 'step_result' | 'completion' | 'error';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  stepId?: string;
  stepNumber?: number;
  stepTitle?: string;
}

export interface ParsedPlan {
  goal: string;
  steps: Array<{
    title: string;
    description: string;
  }>;
}
