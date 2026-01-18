import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  try {
    const response = await fetch('https://api.mistral.ai/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch models';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error?.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();

    const modelsArray = Array.isArray(data) ? data : data.data || [];

    const seenIds = new Set<string>();
    const models = modelsArray
      .filter((m: Record<string, unknown>) => {
        const capabilities = m.capabilities as Record<string, boolean> | undefined;
        if (capabilities?.completion_chat !== true) return false;
        const id = m.id as string;
        if (seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
      })
      .map((m: Record<string, unknown>) => ({
        id: m.id,
        name: formatMistralModelName(m.id as string),
        contextLength: m.max_context_length || 32768,
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

function formatMistralModelName(modelId: string): string {
  const nameMap: Record<string, string> = {
    'mistral-large-latest': 'Mistral Large (Latest)',
    'mistral-large-2411': 'Mistral Large 24.11',
    'mistral-medium-latest': 'Mistral Medium (Latest)',
    'mistral-small-latest': 'Mistral Small (Latest)',
    'mistral-small-2501': 'Mistral Small 25.01',
    'codestral-latest': 'Codestral (Latest)',
    'codestral-2501': 'Codestral 25.01',
    'ministral-8b-latest': 'Ministral 8B (Latest)',
    'ministral-3b-latest': 'Ministral 3B (Latest)',
    'pixtral-large-latest': 'Pixtral Large (Latest)',
    'pixtral-12b-latest': 'Pixtral 12B (Latest)',
    'open-mistral-7b': 'Open Mistral 7B',
    'open-mixtral-8x7b': 'Open Mixtral 8x7B',
    'open-mixtral-8x22b': 'Open Mixtral 8x22B',
    'mistral-embed': 'Mistral Embed',
    'mistral-moderation-latest': 'Mistral Moderation (Latest)',
  };

  if (nameMap[modelId]) {
    return nameMap[modelId];
  }

  return modelId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
