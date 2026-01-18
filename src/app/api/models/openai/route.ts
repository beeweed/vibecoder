import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
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
        return id && (
          id.includes('gpt-4') || 
          id.includes('gpt-3.5') || 
          id.includes('o1') ||
          id.includes('o3') ||
          id.includes('chatgpt')
        );
      })
      .map((m: Record<string, unknown>) => ({
        id: m.id,
        name: formatOpenAIModelName(m.id as string),
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

function getContextLength(modelId: string): number {
  if (modelId.includes('gpt-4o')) return 128000;
  if (modelId.includes('gpt-4-turbo')) return 128000;
  if (modelId.includes('gpt-4-32k')) return 32768;
  if (modelId.includes('gpt-4')) return 8192;
  if (modelId.includes('gpt-3.5-turbo-16k')) return 16384;
  if (modelId.includes('gpt-3.5')) return 4096;
  if (modelId.includes('o1')) return 128000;
  if (modelId.includes('o3')) return 128000;
  return 8192;
}

function formatOpenAIModelName(modelId: string): string {
  const nameMap: Record<string, string> = {
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4o-2024-11-20': 'GPT-4o (Nov 2024)',
    'gpt-4o-2024-08-06': 'GPT-4o (Aug 2024)',
    'gpt-4o-2024-05-13': 'GPT-4o (May 2024)',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-4-turbo-preview': 'GPT-4 Turbo Preview',
    'gpt-4-turbo-2024-04-09': 'GPT-4 Turbo (Apr 2024)',
    'gpt-4': 'GPT-4',
    'gpt-4-32k': 'GPT-4 32K',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K',
    'gpt-3.5-turbo-instruct': 'GPT-3.5 Turbo Instruct',
    'o1-preview': 'O1 Preview',
    'o1-mini': 'O1 Mini',
    'o3-mini': 'O3 Mini',
    'chatgpt-4o-latest': 'ChatGPT-4o Latest',
  };

  if (nameMap[modelId]) {
    return nameMap[modelId];
  }

  return modelId
    .replace(/^gpt-/, 'GPT-')
    .replace(/^o(\d)/, 'O$1')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
