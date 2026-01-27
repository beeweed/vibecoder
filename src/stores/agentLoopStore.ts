import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AgentPhase, PlanStep, AgentPlan, ParsedPlan } from '@/types/agentLoop';

interface AgentLoopStore {
  phase: AgentPhase;
  thinking: string;
  isThinkingStreaming: boolean;
  plan: AgentPlan | null;
  isPlanStreaming: boolean;
  planRawContent: string;
  currentStepIndex: number;
  stepResults: Map<string, string>;
  completionSummary: string;
  isCompletionStreaming: boolean;
  error: string | null;
  abortController: AbortController | null;

  setPhase: (phase: AgentPhase) => void;
  setThinking: (thinking: string, isStreaming?: boolean) => void;
  appendThinking: (chunk: string) => void;
  finalizeThinking: () => void;

  setPlanRawContent: (content: string) => void;
  appendPlanRawContent: (chunk: string) => void;
  setPlanStreaming: (streaming: boolean) => void;
  initializePlan: (parsedPlan: ParsedPlan) => void;
  
  startStep: (stepId: string) => void;
  completeStep: (stepId: string, result: string, filesCreated?: string[], filesUpdated?: string[], filesDeleted?: string[]) => void;
  failStep: (stepId: string, error: string) => void;
  skipStep: (stepId: string) => void;
  
  setCompletionSummary: (summary: string, isStreaming?: boolean) => void;
  appendCompletionSummary: (chunk: string) => void;
  finalizeCompletion: () => void;
  
  setError: (error: string | null) => void;
  setAbortController: (controller: AbortController | null) => void;
  cancelExecution: () => void;
  reset: () => void;
  
  getCurrentStep: () => PlanStep | null;
  getCompletedSteps: () => PlanStep[];
  getPendingSteps: () => PlanStep[];
  isAllStepsCompleted: () => boolean;
}

const initialState = {
  phase: 'idle' as AgentPhase,
  thinking: '',
  isThinkingStreaming: false,
  plan: null as AgentPlan | null,
  isPlanStreaming: false,
  planRawContent: '',
  currentStepIndex: 0,
  stepResults: new Map<string, string>(),
  completionSummary: '',
  isCompletionStreaming: false,
  error: null as string | null,
  abortController: null as AbortController | null,
};

export const useAgentLoopStore = create<AgentLoopStore>((set, get) => ({
  ...initialState,

  setPhase: (phase: AgentPhase) => set({ phase }),

  setThinking: (thinking: string, isStreaming = true) => 
    set({ thinking, isThinkingStreaming: isStreaming }),

  appendThinking: (chunk: string) => 
    set((state) => ({ thinking: state.thinking + chunk })),

  finalizeThinking: () => 
    set({ isThinkingStreaming: false }),

  setPlanRawContent: (content: string) => 
    set({ planRawContent: content }),

  appendPlanRawContent: (chunk: string) => 
    set((state) => ({ planRawContent: state.planRawContent + chunk })),

  setPlanStreaming: (streaming: boolean) => 
    set({ isPlanStreaming: streaming }),

  initializePlan: (parsedPlan: ParsedPlan) => {
    const planId = uuidv4();
    const steps: PlanStep[] = parsedPlan.steps.map((step, index) => ({
      id: uuidv4(),
      stepNumber: index + 1,
      title: step.title,
      description: step.description,
      status: 'pending',
    }));

    const plan: AgentPlan = {
      id: planId,
      goal: parsedPlan.goal,
      steps,
      createdAt: new Date(),
      status: 'pending',
      currentStepIndex: 0,
    };

    set({ 
      plan, 
      currentStepIndex: 0,
      isPlanStreaming: false,
      phase: 'executing',
    });
  },

  startStep: (stepId: string) => {
    set((state) => {
      if (!state.plan) return state;

      const updatedSteps = state.plan.steps.map((step) =>
        step.id === stepId
          ? { ...step, status: 'in_progress' as const, startedAt: new Date() }
          : step
      );

      return {
        plan: { ...state.plan, steps: updatedSteps, status: 'executing' },
      };
    });
  },

  completeStep: (stepId: string, result: string, filesCreated?: string[], filesUpdated?: string[], filesDeleted?: string[]) => {
    set((state) => {
      if (!state.plan) return state;

      const updatedSteps = state.plan.steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              status: 'completed' as const,
              result,
              filesCreated,
              filesUpdated,
              filesDeleted,
              completedAt: new Date(),
            }
          : step
      );

      const newStepResults = new Map(state.stepResults);
      newStepResults.set(stepId, result);

      const nextStepIndex = state.currentStepIndex + 1;

      return {
        plan: { ...state.plan, steps: updatedSteps },
        stepResults: newStepResults,
        currentStepIndex: nextStepIndex,
      };
    });
  },

  failStep: (stepId: string, error: string) => {
    set((state) => {
      if (!state.plan) return state;

      const updatedSteps = state.plan.steps.map((step) =>
        step.id === stepId
          ? { ...step, status: 'error' as const, error, completedAt: new Date() }
          : step
      );

      return {
        plan: { ...state.plan, steps: updatedSteps, status: 'error' },
        phase: 'error',
        error,
      };
    });
  },

  skipStep: (stepId: string) => {
    set((state) => {
      if (!state.plan) return state;

      const updatedSteps = state.plan.steps.map((step) =>
        step.id === stepId
          ? { ...step, status: 'skipped' as const, completedAt: new Date() }
          : step
      );

      const nextStepIndex = state.currentStepIndex + 1;

      return {
        plan: { ...state.plan, steps: updatedSteps },
        currentStepIndex: nextStepIndex,
      };
    });
  },

  setCompletionSummary: (summary: string, isStreaming = true) => 
    set({ completionSummary: summary, isCompletionStreaming: isStreaming }),

  appendCompletionSummary: (chunk: string) => 
    set((state) => ({ completionSummary: state.completionSummary + chunk })),

  finalizeCompletion: () => 
    set((state) => ({ 
      isCompletionStreaming: false, 
      phase: 'completed',
      plan: state.plan ? { ...state.plan, status: 'completed' } : null,
    })),

  setError: (error: string | null) => 
    set({ error, phase: error ? 'error' : get().phase }),

  setAbortController: (controller: AbortController | null) => 
    set({ abortController: controller }),

  cancelExecution: () => {
    const state = get();
    if (state.abortController) {
      state.abortController.abort();
    }
    set({ 
      abortController: null,
      isThinkingStreaming: false,
      isPlanStreaming: false,
      isCompletionStreaming: false,
    });
  },

  reset: () => set(initialState),

  getCurrentStep: () => {
    const state = get();
    if (!state.plan) return null;
    return state.plan.steps[state.currentStepIndex] || null;
  },

  getCompletedSteps: () => {
    const state = get();
    if (!state.plan) return [];
    return state.plan.steps.filter((step) => step.status === 'completed');
  },

  getPendingSteps: () => {
    const state = get();
    if (!state.plan) return [];
    return state.plan.steps.filter((step) => step.status === 'pending');
  },

  isAllStepsCompleted: () => {
    const state = get();
    if (!state.plan) return false;
    return state.plan.steps.every(
      (step) => step.status === 'completed' || step.status === 'skipped'
    );
  },
}));
