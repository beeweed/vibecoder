import { type NextRequest, NextResponse } from 'next/server';

const HUGGINGFACE_MODELS = [
  {
    id: 'Qwen/Qwen3-Coder-480B-A35B-Instruct',
    name: 'Qwen3 Coder 480B A35B Instruct',
    contextLength: 131072,
  },
  {
    id: 'Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8',
    name: 'Qwen3 Coder 480B A35B Instruct FP8',
    contextLength: 131072,
  },
  {
    id: 'Qwen/Qwen3-Coder-30B-A3B-Instruct',
    name: 'Qwen3 Coder 30B A3B Instruct',
    contextLength: 131072,
  },
  {
    id: 'Qwen/Qwen3-Next-80B-A3B-Thinking',
    name: 'Qwen3 Next 80B A3B Thinking',
    contextLength: 131072,
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    contextLength: 131072,
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    contextLength: 131072,
  },
  {
    id: 'MiniMaxAI/MiniMax-M2.1',
    name: 'MiniMax M2.1',
    contextLength: 131072,
  },
  {
    id: 'meta-llama/Llama-3.1-8B-Instruct',
    name: 'Llama 3.1 8B Instruct',
    contextLength: 131072,
  },
  {
    id: 'meta-llama/Meta-Llama-3-8B',
    name: 'Meta Llama 3 8B',
    contextLength: 8192,
  },
  {
    id: 'zai-org/GLM-4.7',
    name: 'GLM 4.7',
    contextLength: 131072,
  },
  {
    id: 'zai-org/GLM-4.6V',
    name: 'GLM 4.6V (Vision)',
    contextLength: 131072,
  },
];

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  try {
    const models = HUGGINGFACE_MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      contextLength: m.contextLength,
      pricing: {
        prompt: 0,
        completion: 0,
      },
    }));

    return NextResponse.json({ models });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch models';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
