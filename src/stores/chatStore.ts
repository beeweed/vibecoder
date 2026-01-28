import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, ThinkingState, FileOperation, ToolCallState, AgentPlanDisplay, PlanStepDisplay, AgentLoopState, AgentActionBlock } from '@/types/chat';

interface ChatStore {
  messages: ChatMessage[];
  isGenerating: boolean;
  isThinking: boolean;
  isExecutingTool: boolean;
  activeToolCallId: string | null;
  abortController: AbortController | null;
  error: string | null;
  lastCancelledMessageId: string | null;

  addUserMessage: (content: string) => string;
  startAssistantMessage: () => string;
  appendToMessage: (messageId: string, chunk: string) => void;
  finalizeMessage: (messageId: string, tokenCount?: number) => void;
  setError: (error: string | null) => void;
  setGenerating: (generating: boolean, controller?: AbortController) => void;
  setThinking: (thinking: boolean) => void;
  cancelGeneration: () => void;
  clearMessages: () => void;
  getMessagesForAPI: () => Array<{ role: string; content: string }>;
  setMessageThinking: (messageId: string, thinking: ThinkingState) => void;
  finalizeThinking: (messageId: string) => void;
  markMessageCancelled: (messageId: string) => void;
  clearCancelled: () => void;
  addFileOperation: (messageId: string, action: 'created' | 'updated' | 'deleted' | 'skipped', filePath: string, reason?: string) => void;
  addToolCall: (messageId: string, name: string, args: Record<string, unknown>) => string;
  updateToolCallStatus: (messageId: string, toolCallId: string, status: ToolCallState['status'], result?: ToolCallState['result']) => void;
  setExecutingTool: (executing: boolean, toolCallId?: string | null) => void;

  setMessageAgentPlan: (messageId: string, plan: AgentPlanDisplay) => void;
  updatePlanRawContent: (messageId: string, rawContent: string) => void;
  appendPlanRawContent: (messageId: string, chunk: string) => void;
  initializePlanSteps: (messageId: string, goal: string, steps: Array<{ title: string; description: string }>) => void;
  startPlanStep: (messageId: string, stepId: string) => void;
  updateStepContent: (messageId: string, stepId: string, content: string, isStreaming?: boolean) => void;
  appendStepContent: (messageId: string, stepId: string, chunk: string) => void;
  completePlanStep: (messageId: string, stepId: string) => void;
  failPlanStep: (messageId: string, stepId: string, error: string) => void;
  addStepFileOperation: (messageId: string, stepId: string, action: 'created' | 'updated' | 'deleted' | 'skipped', filePath: string, reason?: string) => void;
  addStepToolCall: (messageId: string, stepId: string, name: string, args: Record<string, unknown>) => string;
  updateStepToolCallStatus: (messageId: string, stepId: string, toolCallId: string, status: ToolCallState['status'], result?: ToolCallState['result']) => void;
  
  setCompletionSummary: (messageId: string, summary: string, isStreaming?: boolean) => void;
  appendCompletionSummary: (messageId: string, chunk: string) => void;
  finalizeCompletionSummary: (messageId: string) => void;

  // Agent Loop methods
  initializeAgentLoop: (messageId: string) => void;
  addAgentAction: (messageId: string, action: Omit<AgentActionBlock, 'id' | 'timestamp'>) => string;
  updateAgentActionThought: (messageId: string, actionId: string, thought: string, isStreaming?: boolean) => void;
  appendAgentActionThought: (messageId: string, actionId: string, chunk: string) => void;
  updateAgentActionToolCall: (messageId: string, actionId: string, toolCall: Partial<ToolCallState>) => void;
  updateAgentActionFileOp: (messageId: string, actionId: string, fileOp: FileOperation) => void;
  updateAgentActionResponse: (messageId: string, actionId: string, response: string, isStreaming?: boolean) => void;
  appendAgentActionResponse: (messageId: string, actionId: string, chunk: string) => void;
  completeAgentAction: (messageId: string, actionId: string) => void;
  incrementAgentIteration: (messageId: string) => void;
  setAgentLoopComplete: (messageId: string, finalResponse?: string) => void;
  appendAgentFinalResponse: (messageId: string, chunk: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isGenerating: false,
  isThinking: false,
  isExecutingTool: false,
  activeToolCallId: null,
  abortController: null,
  error: null,
  lastCancelledMessageId: null,

  addUserMessage: (content: string) => {
    const id = uuidv4();
    const message: ChatMessage = {
      id,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, message],
      error: null,
    }));

    return id;
  },

  startAssistantMessage: () => {
    const id = uuidv4();
    const message: ChatMessage = {
      id,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    set((state) => ({
      messages: [...state.messages, message],
    }));

    return id;
  },

  appendToMessage: (messageId: string, chunk: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, content: m.content + chunk } : m
      ),
    }));
  },

  finalizeMessage: (messageId: string, tokenCount?: number) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, isStreaming: false, tokenCount }
          : m
      ),
      isGenerating: false,
      abortController: null,
    }));
  },

  setError: (error: string | null) => {
    set({ error, isGenerating: false, isThinking: false, abortController: null });
  },

  setGenerating: (generating: boolean, controller?: AbortController) => {
    set({
      isGenerating: generating,
      abortController: controller || null,
      error: null,
    });
  },

  setThinking: (thinking: boolean) => {
    set({ isThinking: thinking });
  },

  cancelGeneration: () => {
    const state = get();
    if (state.abortController) {
      state.abortController.abort();
    }
    set({ isGenerating: false, isThinking: false, abortController: null });
  },

  clearMessages: () => {
    set({ messages: [], error: null });
  },

  getMessagesForAPI: () => {
    const state = get();
    return state.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  },

  setMessageThinking: (messageId: string, thinking: ThinkingState) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, thinking } : m
      ),
    }));
  },

  finalizeThinking: (messageId: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.thinking
          ? { ...m, thinking: { ...m.thinking, isStreaming: false } }
          : m
      ),
      isThinking: false,
    }));
  },

  markMessageCancelled: (messageId: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, isStreaming: false, wasCancelled: true }
          : m
      ),
      lastCancelledMessageId: messageId,
    }));
  },

  clearCancelled: () => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.wasCancelled ? { ...m, wasCancelled: false } : m
      ),
      lastCancelledMessageId: null,
    }));
  },

  addFileOperation: (messageId: string, action: 'created' | 'updated' | 'deleted' | 'skipped', filePath: string, reason?: string) => {
    const fileName = filePath.split('/').pop() || filePath;
    const operation: FileOperation = {
      id: uuidv4(),
      action,
      filePath,
      fileName,
      reason,
    };
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, fileOperations: [...(m.fileOperations || []), operation] }
          : m
      ),
    }));
  },

  addToolCall: (messageId: string, name: string, args: Record<string, unknown>) => {
    const toolCallId = uuidv4();
    const toolCall: ToolCallState = {
      id: toolCallId,
      name,
      arguments: args,
      status: 'pending',
      startedAt: new Date(),
    };
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, toolCalls: [...(m.toolCalls || []), toolCall] }
          : m
      ),
    }));
    return toolCallId;
  },

  updateToolCallStatus: (messageId: string, toolCallId: string, status: ToolCallState['status'], result?: ToolCallState['result']) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              toolCalls: m.toolCalls?.map((tc) =>
                tc.id === toolCallId
                  ? {
                      ...tc,
                      status,
                      result,
                      completedAt: status === 'completed' || status === 'error' ? new Date() : undefined,
                    }
                  : tc
              ),
            }
          : m
      ),
    }));
  },

  setExecutingTool: (executing: boolean, toolCallId?: string | null) => {
    set({
      isExecutingTool: executing,
      activeToolCallId: toolCallId ?? null,
    });
  },

  setMessageAgentPlan: (messageId: string, plan: AgentPlanDisplay) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, agentPlan: plan } : m
      ),
    }));
  },

  updatePlanRawContent: (messageId: string, rawContent: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, agentPlan: m.agentPlan ? { ...m.agentPlan, rawContent, isStreaming: true } : { goal: '', steps: [], rawContent, isStreaming: true } }
          : m
      ),
    }));
  },

  appendPlanRawContent: (messageId: string, chunk: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentPlan
          ? { ...m, agentPlan: { ...m.agentPlan, rawContent: (m.agentPlan.rawContent || '') + chunk } }
          : m
      ),
    }));
  },

  initializePlanSteps: (messageId: string, goal: string, steps: Array<{ title: string; description: string }>) => {
    const planSteps: PlanStepDisplay[] = steps.map((step, index) => ({
      id: uuidv4(),
      stepNumber: index + 1,
      title: step.title,
      description: step.description,
      status: 'pending',
    }));

    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, agentPlan: { goal, steps: planSteps, isStreaming: false } }
          : m
      ),
    }));
  },

  startPlanStep: (messageId: string, stepId: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentPlan
          ? {
              ...m,
              agentPlan: {
                ...m.agentPlan,
                steps: m.agentPlan.steps.map((step) =>
                  step.id === stepId
                    ? { ...step, status: 'in_progress' as const, isStreaming: true, content: '' }
                    : step
                ),
              },
            }
          : m
      ),
    }));
  },

  updateStepContent: (messageId: string, stepId: string, content: string, isStreaming = true) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentPlan
          ? {
              ...m,
              agentPlan: {
                ...m.agentPlan,
                steps: m.agentPlan.steps.map((step) =>
                  step.id === stepId ? { ...step, content, isStreaming } : step
                ),
              },
            }
          : m
      ),
    }));
  },

  appendStepContent: (messageId: string, stepId: string, chunk: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentPlan
          ? {
              ...m,
              agentPlan: {
                ...m.agentPlan,
                steps: m.agentPlan.steps.map((step) =>
                  step.id === stepId
                    ? { ...step, content: (step.content || '') + chunk }
                    : step
                ),
              },
            }
          : m
      ),
    }));
  },

  completePlanStep: (messageId: string, stepId: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentPlan
          ? {
              ...m,
              agentPlan: {
                ...m.agentPlan,
                steps: m.agentPlan.steps.map((step) =>
                  step.id === stepId
                    ? { ...step, status: 'completed' as const, isStreaming: false }
                    : step
                ),
              },
            }
          : m
      ),
    }));
  },

  failPlanStep: (messageId: string, stepId: string, error: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentPlan
          ? {
              ...m,
              agentPlan: {
                ...m.agentPlan,
                steps: m.agentPlan.steps.map((step) =>
                  step.id === stepId
                    ? { ...step, status: 'error' as const, isStreaming: false, error }
                    : step
                ),
              },
            }
          : m
      ),
    }));
  },

  addStepFileOperation: (messageId: string, stepId: string, action: 'created' | 'updated' | 'deleted' | 'skipped', filePath: string, reason?: string) => {
    const fileName = filePath.split('/').pop() || filePath;
    const operation: FileOperation = {
      id: uuidv4(),
      action,
      filePath,
      fileName,
      reason,
    };
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentPlan
          ? {
              ...m,
              agentPlan: {
                ...m.agentPlan,
                steps: m.agentPlan.steps.map((step) =>
                  step.id === stepId
                    ? { ...step, fileOperations: [...(step.fileOperations || []), operation] }
                    : step
                ),
              },
            }
          : m
      ),
    }));
  },

  addStepToolCall: (messageId: string, stepId: string, name: string, args: Record<string, unknown>) => {
    const toolCallId = uuidv4();
    const toolCall: ToolCallState = {
      id: toolCallId,
      name,
      arguments: args,
      status: 'pending',
      startedAt: new Date(),
    };
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentPlan
          ? {
              ...m,
              agentPlan: {
                ...m.agentPlan,
                steps: m.agentPlan.steps.map((step) =>
                  step.id === stepId
                    ? { ...step, toolCalls: [...(step.toolCalls || []), toolCall] }
                    : step
                ),
              },
            }
          : m
      ),
    }));
    return toolCallId;
  },

  updateStepToolCallStatus: (messageId: string, stepId: string, toolCallId: string, status: ToolCallState['status'], result?: ToolCallState['result']) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentPlan
          ? {
              ...m,
              agentPlan: {
                ...m.agentPlan,
                steps: m.agentPlan.steps.map((step) =>
                  step.id === stepId
                    ? {
                        ...step,
                        toolCalls: step.toolCalls?.map((tc) =>
                          tc.id === toolCallId
                            ? { ...tc, status, result, completedAt: status === 'completed' || status === 'error' ? new Date() : undefined }
                            : tc
                        ),
                      }
                    : step
                ),
              },
            }
          : m
      ),
    }));
  },

  setCompletionSummary: (messageId: string, summary: string, isStreaming = true) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, completionSummary: summary, isCompletionStreaming: isStreaming }
          : m
      ),
    }));
  },

  appendCompletionSummary: (messageId: string, chunk: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, completionSummary: (m.completionSummary || '') + chunk }
          : m
      ),
    }));
  },

  finalizeCompletionSummary: (messageId: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, isCompletionStreaming: false }
          : m
      ),
    }));
  },

  // Agent Loop methods
  initializeAgentLoop: (messageId: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              agentLoop: {
                isActive: true,
                currentIteration: 1,
                maxIterations: 20,
                actions: [],
                isComplete: false,
              },
            }
          : m
      ),
    }));
  },

  addAgentAction: (messageId: string, action: Omit<AgentActionBlock, 'id' | 'timestamp'>) => {
    const actionId = uuidv4();
    const newAction: AgentActionBlock = {
      ...action,
      id: actionId,
      timestamp: new Date(),
    };
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentLoop
          ? {
              ...m,
              agentLoop: {
                ...m.agentLoop,
                actions: [...m.agentLoop.actions, newAction],
              },
            }
          : m
      ),
    }));
    return actionId;
  },

  updateAgentActionThought: (messageId: string, actionId: string, thought: string, isStreaming = true) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentLoop
          ? {
              ...m,
              agentLoop: {
                ...m.agentLoop,
                actions: m.agentLoop.actions.map((a) =>
                  a.id === actionId
                    ? { ...a, thought, thoughtStreaming: isStreaming }
                    : a
                ),
              },
            }
          : m
      ),
    }));
  },

  appendAgentActionThought: (messageId: string, actionId: string, chunk: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentLoop
          ? {
              ...m,
              agentLoop: {
                ...m.agentLoop,
                actions: m.agentLoop.actions.map((a) =>
                  a.id === actionId
                    ? { ...a, thought: (a.thought || '') + chunk, thoughtStreaming: true }
                    : a
                ),
              },
            }
          : m
      ),
    }));
  },

  updateAgentActionToolCall: (messageId: string, actionId: string, toolCall: Partial<ToolCallState>) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentLoop
          ? {
              ...m,
              agentLoop: {
                ...m.agentLoop,
                actions: m.agentLoop.actions.map((a) =>
                  a.id === actionId
                    ? {
                        ...a,
                        toolCall: a.toolCall
                          ? { ...a.toolCall, ...toolCall }
                          : {
                              id: uuidv4(),
                              name: toolCall.name || '',
                              arguments: toolCall.arguments || {},
                              status: toolCall.status || 'pending',
                              startedAt: new Date(),
                              ...toolCall,
                            },
                      }
                    : a
                ),
              },
            }
          : m
      ),
    }));
  },

  updateAgentActionFileOp: (messageId: string, actionId: string, fileOp: FileOperation) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentLoop
          ? {
              ...m,
              agentLoop: {
                ...m.agentLoop,
                actions: m.agentLoop.actions.map((a) =>
                  a.id === actionId ? { ...a, fileOperation: fileOp } : a
                ),
              },
            }
          : m
      ),
    }));
  },

  updateAgentActionResponse: (messageId: string, actionId: string, response: string, isStreaming = true) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentLoop
          ? {
              ...m,
              agentLoop: {
                ...m.agentLoop,
                actions: m.agentLoop.actions.map((a) =>
                  a.id === actionId
                    ? { ...a, response, responseStreaming: isStreaming }
                    : a
                ),
              },
            }
          : m
      ),
    }));
  },

  appendAgentActionResponse: (messageId: string, actionId: string, chunk: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentLoop
          ? {
              ...m,
              agentLoop: {
                ...m.agentLoop,
                actions: m.agentLoop.actions.map((a) =>
                  a.id === actionId
                    ? { ...a, response: (a.response || '') + chunk, responseStreaming: true }
                    : a
                ),
              },
            }
          : m
      ),
    }));
  },

  completeAgentAction: (messageId: string, actionId: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentLoop
          ? {
              ...m,
              agentLoop: {
                ...m.agentLoop,
                actions: m.agentLoop.actions.map((a) =>
                  a.id === actionId
                    ? { ...a, isComplete: true, thoughtStreaming: false, responseStreaming: false }
                    : a
                ),
              },
            }
          : m
      ),
    }));
  },

  incrementAgentIteration: (messageId: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentLoop
          ? {
              ...m,
              agentLoop: {
                ...m.agentLoop,
                currentIteration: m.agentLoop.currentIteration + 1,
              },
            }
          : m
      ),
    }));
  },

  setAgentLoopComplete: (messageId: string, finalResponse?: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentLoop
          ? {
              ...m,
              agentLoop: {
                ...m.agentLoop,
                isComplete: true,
                isActive: false,
                finalResponse,
                finalResponseStreaming: false,
              },
            }
          : m
      ),
    }));
  },

  appendAgentFinalResponse: (messageId: string, chunk: string) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId && m.agentLoop
          ? {
              ...m,
              agentLoop: {
                ...m.agentLoop,
                finalResponse: (m.agentLoop.finalResponse || '') + chunk,
                finalResponseStreaming: true,
              },
            }
          : m
      ),
    }));
  },
}));
