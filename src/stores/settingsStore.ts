import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OpenRouterModel } from '@/types/openrouter';

export type Provider = 'openrouter' | 'groq';

interface SettingsStore {
  provider: Provider;
  apiKey: string | null;
  groqApiKey: string | null;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  systemInstruction: string;
  availableModels: OpenRouterModel[];
  isSettingsOpen: boolean;

  setProvider: (provider: Provider) => void;
  setApiKey: (key: string | null) => void;
  setGroqApiKey: (key: string | null) => void;
  setSelectedModel: (modelId: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setSystemInstruction: (instruction: string) => void;
  setAvailableModels: (models: OpenRouterModel[]) => void;
  setSettingsOpen: (open: boolean) => void;
  clearSettings: () => void;
  isConfigured: () => boolean;
  getActiveApiKey: () => string | null;
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
      provider: 'openrouter' as Provider,
      apiKey: null,
      groqApiKey: null,
      selectedModel: 'anthropic/claude-sonnet-4',
      temperature: 0.7,
      maxTokens: 8192,
      systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
      availableModels: [],
      isSettingsOpen: false,

      setProvider: (provider: Provider) => {
        const defaultModel = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'anthropic/claude-sonnet-4';
        set({ provider, selectedModel: defaultModel, availableModels: [] });
      },
      setApiKey: (key: string | null) => set({ apiKey: key }),
      setGroqApiKey: (key: string | null) => set({ groqApiKey: key }),
      setSelectedModel: (modelId: string) => set({ selectedModel: modelId }),
      setTemperature: (temp: number) => set({ temperature: temp }),
      setMaxTokens: (tokens: number) => set({ maxTokens: tokens }),
      setSystemInstruction: (instruction: string) => set({ systemInstruction: instruction }),
      setAvailableModels: (models: OpenRouterModel[]) => set({ availableModels: models }),
      setSettingsOpen: (open: boolean) => set({ isSettingsOpen: open }),
      
      clearSettings: () =>
        set({
          provider: 'openrouter',
          apiKey: null,
          groqApiKey: null,
          selectedModel: 'anthropic/claude-sonnet-4',
          temperature: 0.7,
          maxTokens: 8192,
          systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
          availableModels: [],
        }),

      isConfigured: () => {
        const state = get();
        const activeKey = state.provider === 'groq' ? state.groqApiKey : state.apiKey;
        return !!activeKey && !!state.selectedModel;
      },

      getActiveApiKey: () => {
        const state = get();
        return state.provider === 'groq' ? state.groqApiKey : state.apiKey;
      },
    }),
    {
      name: 'vibecoder-settings',
      partialize: (state) => ({
        provider: state.provider,
        apiKey: state.apiKey,
        groqApiKey: state.groqApiKey,
        selectedModel: state.selectedModel,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
        systemInstruction: state.systemInstruction,
      }),
    }
  )
);
