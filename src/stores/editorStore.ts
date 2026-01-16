import { create } from 'zustand';

export interface EditorTab {
  id: string;
  filePath: string;
  fileName: string;
  isModified: boolean;
}

interface EditorStore {
  tabs: EditorTab[];
  activeTabId: string | null;
  cursorPosition: { line: number; column: number };

  openFile: (path: string, fileName: string) => void;
  closeTab: (tabId: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (tabId: string) => void;
  markTabModified: (tabId: string, modified: boolean) => void;
  setCursorPosition: (line: number, column: number) => void;
  getActiveFilePath: () => string | null;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  cursorPosition: { line: 1, column: 1 },

  openFile: (path: string, fileName: string) => {
    const state = get();
    const existingTab = state.tabs.find((t) => t.filePath === path);

    if (existingTab) {
      set({ activeTabId: existingTab.id });
      return;
    }

    const newTab: EditorTab = {
      id: `tab-${Date.now()}`,
      filePath: path,
      fileName,
      isModified: false,
    };

    set({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    });
  },

  closeTab: (tabId: string) => {
    set((state) => {
      const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
      const newTabs = state.tabs.filter((t) => t.id !== tabId);

      let newActiveTabId = state.activeTabId;
      if (state.activeTabId === tabId) {
        if (tabIndex > 0) {
          newActiveTabId = newTabs[tabIndex - 1]?.id || null;
        } else {
          newActiveTabId = newTabs[0]?.id || null;
        }
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveTabId,
      };
    });
  },

  closeAllTabs: () => {
    set({ tabs: [], activeTabId: null });
  },

  setActiveTab: (tabId: string) => {
    set({ activeTabId: tabId });
  },

  markTabModified: (tabId: string, modified: boolean) => {
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, isModified: modified } : t
      ),
    }));
  },

  setCursorPosition: (line: number, column: number) => {
    set({ cursorPosition: { line, column } });
  },

  getActiveFilePath: () => {
    const state = get();
    const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
    return activeTab?.filePath || null;
  },
}));
