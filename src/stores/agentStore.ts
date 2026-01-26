import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AgentStatus, ActivityLogEntry } from '@/types/agent';

interface AgentStore {
  status: AgentStatus;
  currentOperation: string | null;
  currentFile: string | null;
  activityLog: ActivityLogEntry[];
  errorMessage: string | null;

  setStatus: (status: AgentStatus) => void;
  setCurrentOperation: (operation: string | null) => void;
  setCurrentFile: (file: string | null) => void;
  addActivityLog: (action: 'created' | 'updated' | 'deleted' | 'skipped' | 'read', filePath: string) => void;
  setError: (message: string | null) => void;
  clearActivityLog: () => void;
  reset: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  status: 'idle',
  currentOperation: null,
  currentFile: null,
  activityLog: [],
  errorMessage: null,

  setStatus: (status: AgentStatus) => set({ status }),
  
  setCurrentOperation: (operation: string | null) => set({ currentOperation: operation }),
  
  setCurrentFile: (file: string | null) => set({ currentFile: file }),

  addActivityLog: (action: 'created' | 'updated' | 'deleted' | 'skipped' | 'read', filePath: string) => {
    const entry: ActivityLogEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      action,
      filePath,
    };
    set((state) => ({
      activityLog: [entry, ...state.activityLog].slice(0, 100),
    }));
  },

  setError: (message: string | null) => {
    set({
      errorMessage: message,
      status: message ? 'error' : 'idle',
    });
  },

  clearActivityLog: () => set({ activityLog: [] }),

  reset: () =>
    set({
      status: 'idle',
      currentOperation: null,
      currentFile: null,
      errorMessage: null,
    }),
}));
