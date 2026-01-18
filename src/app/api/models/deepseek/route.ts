import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  try {
    const response = await fetch('https://api.deepseek.com/models', {
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
        name: formatDeepSeekModelName(m.id as string),
        contextLength: 65536,
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

function formatDeepSeekModelName(modelId: string): string {
  const nameMap: Record<string, string> = {
    'deepseek-chat': 'DeepSeek Chat (V3)',
    'deepseek-reasoner': 'DeepSeek Reasoner (R1)',
  };

  if (nameMap[modelId]) {
    return nameMap[modelId];
  }

  return modelId
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
