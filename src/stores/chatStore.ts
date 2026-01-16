import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage } from '@/types/chat';

interface ChatStore {
  messages: ChatMessage[];
  isGenerating: boolean;
  abortController: AbortController | null;
  error: string | null;

  addUserMessage: (content: string) => void;
  startAssistantMessage: () => string;
  appendToMessage: (messageId: string, chunk: string) => void;
  finalizeMessage: (messageId: string, tokenCount?: number) => void;
  setError: (error: string | null) => void;
  setGenerating: (generating: boolean, controller?: AbortController) => void;
  cancelGeneration: () => void;
  clearMessages: () => void;
  getMessagesForAPI: () => Array<{ role: string; content: string }>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isGenerating: false,
  abortController: null,
  error: null,

  addUserMessage: (content: string) => {
    const message: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, message],
      error: null,
    }));
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
    set({ error, isGenerating: false, abortController: null });
  },

  setGenerating: (generating: boolean, controller?: AbortController) => {
    set({
      isGenerating: generating,
      abortController: controller || null,
      error: null,
    });
  },

  cancelGeneration: () => {
    const state = get();
    if (state.abortController) {
      state.abortController.abort();
    }
    set({ isGenerating: false, abortController: null });
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
}));
