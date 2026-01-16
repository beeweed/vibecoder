export interface OpenRouterModel {
  id: string;
  name: string;
  contextLength: number;
  pricing: {
    prompt: number;
    completion: number;
  };
}

export interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface SettingsState {
  apiKey: string | null;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  systemInstruction: string;
  availableModels: OpenRouterModel[];
}
