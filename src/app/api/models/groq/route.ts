import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
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
      .filter((m: Record<string, unknown>) => {
        const id = m.id as string;
        return id && !id.includes('whisper');
      })
      .map((m: Record<string, unknown>) => ({
        id: m.id,
        name: formatGroqModelName(m.id as string),
        contextLength: m.context_window || 131072,
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

function formatGroqModelName(modelId: string): string {
  const nameMap: Record<string, string> = {
    'llama-3.1-8b-instant': 'Llama 3.1 8B Instant',
    'llama-3.3-70b-versatile': 'Llama 3.3 70B Versatile',
    'meta-llama/llama-guard-4-12b': 'Llama Guard 4 12B',
    'openai/gpt-oss-120b': 'GPT OSS 120B',
    'openai/gpt-oss-20b': 'GPT OSS 20B',
    'groq/compound': 'Groq Compound',
    'groq/compound-mini': 'Groq Compound Mini',
    'meta-llama/llama-4-maverick-17b-128e-instruct': 'Llama 4 Maverick 17B',
    'meta-llama/llama-4-scout-17b-16e-instruct': 'Llama 4 Scout 17B',
    'qwen/qwen3-32b': 'Qwen 3 32B',
    'moonshotai/kimi-k2-instruct-0905': 'Kimi K2',
  };

  if (nameMap[modelId]) {
    return nameMap[modelId];
  }

  return modelId
    .replace(/^(meta-llama|openai|groq|qwen|moonshotai|canopylabs)\//, '')
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
