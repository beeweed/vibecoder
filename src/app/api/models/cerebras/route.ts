import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  try {
    const response = await fetch('https://api.cerebras.ai/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch models';
      try {
        const error = await response.json();
        errorMessage = error.error?.message || error.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();

    const models = data.data
      .map((m: Record<string, unknown>) => ({
        id: m.id,
        name: formatCerebrasModelName(m.id as string),
        contextLength: getContextLength(m.id as string),
        pricing: {
          prompt: 0,
          completion: 0,
        },
      }))
      .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

    return NextResponse.json({ models });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch models';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function formatCerebrasModelName(modelId: string): string {
  const nameMap: Record<string, string> = {
    'llama3.1-8b': 'Llama 3.1 8B',
    'llama-3.3-70b': 'Llama 3.3 70B',
    'qwen-3-32b': 'Qwen 3 32B',
    'qwen-3-235b-a22b-instruct-2507': 'Qwen 3 235B A22B (Preview)',
    'gpt-oss-120b': 'GPT OSS 120B',
    'zai-glm-4.6': 'ZAI GLM 4.6 (Preview)',
    'zai-glm-4.7': 'ZAI GLM 4.7 (Preview)',
    'llama-4-scout-17b-16e-instruct': 'Llama 4 Scout 17B',
  };

  if (nameMap[modelId]) {
    return nameMap[modelId];
  }

  return modelId
    .split(/[-_.]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getContextLength(modelId: string): number {
  const contextMap: Record<string, number> = {
    'llama3.1-8b': 128000,
    'llama-3.3-70b': 128000,
    'qwen-3-32b': 32768,
    'qwen-3-235b-a22b-instruct-2507': 131072,
    'gpt-oss-120b': 131072,
    'zai-glm-4.6': 32768,
    'zai-glm-4.7': 32768,
    'llama-4-scout-17b-16e-instruct': 131072,
  };

  return contextMap[modelId] || 32768;
}
