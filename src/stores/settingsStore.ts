import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OpenRouterModel } from '@/types/openrouter';

interface SettingsStore {
  apiKey: string | null;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  systemInstruction: string;
  availableModels: OpenRouterModel[];
  isSettingsOpen: boolean;

  setApiKey: (key: string | null) => void;
  setSelectedModel: (modelId: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setSystemInstruction: (instruction: string) => void;
  setAvailableModels: (models: OpenRouterModel[]) => void;
  setSettingsOpen: (open: boolean) => void;
  clearSettings: () => void;
  isConfigured: () => boolean;
}

const DEFAULT_SYSTEM_INSTRUCTION = `You are VibeCoder, an expert AI coding agent. Focus on writing clean, production-quality code.

CRITICAL: All code MUST be inside file markers. NEVER output code in regular text.

File operation format:
- <<<FILE_CREATE: src/path/file.tsx>>> [code] <<<FILE_END>>> - Create new file
- <<<FILE_UPDATE: src/path/file.tsx>>> [code] <<<FILE_END>>> - Update file
- <<<FILE_DELETE: src/path/file.tsx>>> - Delete file

Rules:
- Put ALL code inside file markers only
- Use complete file paths (src/components/...)
- Provide complete file contents, not snippets
- Keep chat explanations brief`;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      apiKey: null,
      selectedModel: 'anthropic/claude-sonnet-4',
      temperature: 0.7,
      maxTokens: 8192,
      systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
      availableModels: [],
      isSettingsOpen: false,

      setApiKey: (key: string | null) => set({ apiKey: key }),
      setSelectedModel: (modelId: string) => set({ selectedModel: modelId }),
      setTemperature: (temp: number) => set({ temperature: temp }),
      setMaxTokens: (tokens: number) => set({ maxTokens: tokens }),
      setSystemInstruction: (instruction: string) => set({ systemInstruction: instruction }),
      setAvailableModels: (models: OpenRouterModel[]) => set({ availableModels: models }),
      setSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),
      
      clearSettings: () =>
        set({
          apiKey: null,
          selectedModel: 'anthropic/claude-sonnet-4',
          temperature: 0.7,
          maxTokens: 8192,
          systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
          availableModels: [],
        }),

      isConfigured: () => {
        const state = get();
        return !!state.apiKey && !!state.selectedModel;
      },
    }),
    {
      name: 'vibecoder-settings',
      partialize: (state) => ({
        apiKey: state.apiKey,
        selectedModel: state.selectedModel,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
        systemInstruction: state.systemInstruction,
      }),
    }
  )
);
