import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, ThinkingState, FileOperation, FileRead } from '@/types/chat';

interface ChatStore {
  messages: ChatMessage[];
  isGenerating: boolean;
  isThinking: boolean;
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
  addFileOperation: (messageId: string, action: 'created' | 'updated' | 'deleted', filePath: string) => void;
  addFileRead: (messageId: string, path: string) => void;
  updateFileReadStatus: (messageId: string, path: string, status: 'done' | 'error') => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isGenerating: false,
  isThinking: false,
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

  addFileOperation: (messageId: string, action: 'created' | 'updated' | 'deleted', filePath: string) => {
    const fileName = filePath.split('/').pop() || filePath;
    const operation: FileOperation = {
      id: uuidv4(),
      action,
      filePath,
      fileName,
    };
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, fileOperations: [...(m.fileOperations || []), operation] }
          : m
      ),
    }));
  },

  addFileRead: (messageId: string, path: string) => {
    const fileName = path.split('/').pop() || path;
    const fileRead: FileRead = {
      id: uuidv4(),
      path,
      fileName,
      status: 'reading',
    };
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, fileReads: [...(m.fileReads || []), fileRead] }
          : m
      ),
    }));
  },

  updateFileReadStatus: (messageId: string, path: string, status: 'done' | 'error') => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? {
              ...m,
              fileReads: (m.fileReads || []).map((fr) =>
                fr.path === path && fr.status === 'reading'
                  ? { ...fr, status }
                  : fr
              ),
            }
          : m
      ),
    }));
  },
}));
