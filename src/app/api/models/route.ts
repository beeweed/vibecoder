import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
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
      .filter((m: Record<string, unknown>) => m.id && m.name)
      .map((m: Record<string, unknown>) => ({
        id: m.id,
        name: m.name,
        contextLength: m.context_length || 0,
        pricing: {
          prompt: (m.pricing as Record<string, unknown>)?.prompt || 0,
          completion: (m.pricing as Record<string, unknown>)?.completion || 0,
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
