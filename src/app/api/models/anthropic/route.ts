import { type NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_MODELS = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    contextLength: 200000,
    pricing: { prompt: 3, completion: 15 },
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    contextLength: 200000,
    pricing: { prompt: 15, completion: 75 },
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    contextLength: 200000,
    pricing: { prompt: 3, completion: 15 },
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    contextLength: 200000,
    pricing: { prompt: 3, completion: 15 },
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    contextLength: 200000,
    pricing: { prompt: 0.8, completion: 4 },
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    contextLength: 200000,
    pricing: { prompt: 15, completion: 75 },
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    contextLength: 200000,
    pricing: { prompt: 0.25, completion: 1.25 },
  },
];

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ models: ANTHROPIC_MODELS });
      }
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

    if (data.data && Array.isArray(data.data)) {
      const models = data.data
        .filter((m: Record<string, unknown>) => {
          const id = m.id as string;
          return id?.startsWith('claude');
        })
        .map((m: Record<string, unknown>) => ({
          id: m.id,
          name: formatAnthropicModelName(m.id as string),
          contextLength: 200000,
          pricing: {
            prompt: 0,
            completion: 0,
          },
        }))
        .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

      return NextResponse.json({ models: models.length > 0 ? models : ANTHROPIC_MODELS });
    }

    return NextResponse.json({ models: ANTHROPIC_MODELS });
  } catch (error) {
    return NextResponse.json({ models: ANTHROPIC_MODELS });
  }
}

function formatAnthropicModelName(modelId: string): string {
  const nameMap: Record<string, string> = {
    'claude-sonnet-4-20250514': 'Claude Sonnet 4',
    'claude-sonnet-4-0': 'Claude Sonnet 4',
    'claude-opus-4-20250514': 'Claude Opus 4',
    'claude-opus-4-0': 'Claude Opus 4',
    'claude-3-7-sonnet-20250219': 'Claude 3.7 Sonnet',
    'claude-3-7-sonnet-latest': 'Claude 3.7 Sonnet (Latest)',
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
    'claude-3-5-sonnet-20240620': 'Claude 3.5 Sonnet (Jun 2024)',
    'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
    'claude-3-5-haiku-latest': 'Claude 3.5 Haiku (Latest)',
    'claude-3-opus-20240229': 'Claude 3 Opus',
    'claude-3-opus-latest': 'Claude 3 Opus (Latest)',
    'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
    'claude-3-haiku-20240307': 'Claude 3 Haiku',
  };

  if (nameMap[modelId]) {
    return nameMap[modelId];
  }

  return modelId
    .replace(/^claude-/, 'Claude ')
    .replace(/-(\d{8})$/, ' ($1)')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
