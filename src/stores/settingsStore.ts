import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OpenRouterModel } from '@/types/openrouter';

export type Provider = 'openrouter' | 'groq' | 'cohere' | 'chutes' | 'fireworks' | 'cerebras' | 'huggingface' | 'gemini' | 'mistral';

interface SettingsStore {
  provider: Provider;
  apiKey: string | null;
  groqApiKey: string | null;
  cohereApiKey: string | null;
  chutesApiKey: string | null;
  fireworksApiKey: string | null;
  cerebrasApiKey: string | null;
  huggingfaceApiKey: string | null;
  geminiApiKey: string | null;
  mistralApiKey: string | null;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  systemInstruction: string;
  availableModels: OpenRouterModel[];
  isSettingsOpen: boolean;

  setProvider: (provider: Provider) => void;
  setApiKey: (key: string | null) => void;
  setGroqApiKey: (key: string | null) => void;
  setCohereApiKey: (key: string | null) => void;
  setChutesApiKey: (key: string | null) => void;
  setFireworksApiKey: (key: string | null) => void;
  setCerebrasApiKey: (key: string | null) => void;
  setHuggingfaceApiKey: (key: string | null) => void;
  setGeminiApiKey: (key: string | null) => void;
  setMistralApiKey: (key: string | null) => void;
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

const getDefaultModel = (provider: Provider): string => {
  switch (provider) {
    case 'groq':
      return 'llama-3.3-70b-versatile';
    case 'cohere':
      return 'command-a-03-2025';
    case 'chutes':
      return 'chutesai/Mistral-Small-3.1-24B-Instruct-2503';
    case 'fireworks':
      return 'accounts/fireworks/models/llama-v3p1-70b-instruct';
    case 'cerebras':
      return 'llama-3.3-70b';
    case 'huggingface':
      return 'Qwen/Qwen3-Coder-480B-A35B-Instruct';
    case 'gemini':
      return 'gemini-2.5-flash';
    case 'mistral':
      return 'mistral-large-latest';
    default:
      return 'anthropic/claude-sonnet-4';
  }
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      provider: 'openrouter' as Provider,
      apiKey: null,
      groqApiKey: null,
      cohereApiKey: null,
      chutesApiKey: null,
      fireworksApiKey: null,
      cerebrasApiKey: null,
      huggingfaceApiKey: null,
      geminiApiKey: null,
      mistralApiKey: null,
      selectedModel: 'anthropic/claude-sonnet-4',
      temperature: 0.7,
      maxTokens: 8192,
      systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
      availableModels: [],
      isSettingsOpen: false,

      setProvider: (provider: Provider) => {
        set({ provider, selectedModel: getDefaultModel(provider), availableModels: [] });
      },
      setApiKey: (key: string | null) => set({ apiKey: key }),
      setGroqApiKey: (key: string | null) => set({ groqApiKey: key }),
      setCohereApiKey: (key: string | null) => set({ cohereApiKey: key }),
      setChutesApiKey: (key: string | null) => set({ chutesApiKey: key }),
      setFireworksApiKey: (key: string | null) => set({ fireworksApiKey: key }),
      setCerebrasApiKey: (key: string | null) => set({ cerebrasApiKey: key }),
      setHuggingfaceApiKey: (key: string | null) => set({ huggingfaceApiKey: key }),
      setGeminiApiKey: (key: string | null) => set({ geminiApiKey: key }),
      setMistralApiKey: (key: string | null) => set({ mistralApiKey: key }),
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
          cohereApiKey: null,
          chutesApiKey: null,
          fireworksApiKey: null,
          cerebrasApiKey: null,
          huggingfaceApiKey: null,
          geminiApiKey: null,
          mistralApiKey: null,
          selectedModel: 'anthropic/claude-sonnet-4',
          temperature: 0.7,
          maxTokens: 8192,
          systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
          availableModels: [],
        }),

      isConfigured: () => {
        const state = get();
        let activeKey: string | null = null;
        if (state.provider === 'groq') activeKey = state.groqApiKey;
        else if (state.provider === 'cohere') activeKey = state.cohereApiKey;
        else if (state.provider === 'chutes') activeKey = state.chutesApiKey;
        else if (state.provider === 'fireworks') activeKey = state.fireworksApiKey;
        else if (state.provider === 'cerebras') activeKey = state.cerebrasApiKey;
        else if (state.provider === 'huggingface') activeKey = state.huggingfaceApiKey;
        else if (state.provider === 'gemini') activeKey = state.geminiApiKey;
        else if (state.provider === 'mistral') activeKey = state.mistralApiKey;
        else activeKey = state.apiKey;
        return !!activeKey && !!state.selectedModel;
      },

      getActiveApiKey: () => {
        const state = get();
        if (state.provider === 'groq') return state.groqApiKey;
        if (state.provider === 'cohere') return state.cohereApiKey;
        if (state.provider === 'chutes') return state.chutesApiKey;
        if (state.provider === 'fireworks') return state.fireworksApiKey;
        if (state.provider === 'cerebras') return state.cerebrasApiKey;
        if (state.provider === 'huggingface') return state.huggingfaceApiKey;
        if (state.provider === 'gemini') return state.geminiApiKey;
        if (state.provider === 'mistral') return state.mistralApiKey;
        return state.apiKey;
      },
    }),
    {
      name: 'vibecoder-settings',
      partialize: (state) => ({
        provider: state.provider,
        apiKey: state.apiKey,
        groqApiKey: state.groqApiKey,
        cohereApiKey: state.cohereApiKey,
        chutesApiKey: state.chutesApiKey,
        fireworksApiKey: state.fireworksApiKey,
        cerebrasApiKey: state.cerebrasApiKey,
        huggingfaceApiKey: state.huggingfaceApiKey,
        geminiApiKey: state.geminiApiKey,
        mistralApiKey: state.mistralApiKey,
        selectedModel: state.selectedModel,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
        systemInstruction: state.systemInstruction,
      }),
    }
  )
);
