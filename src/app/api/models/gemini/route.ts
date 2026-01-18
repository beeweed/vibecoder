import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

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

    const models = data.models
      .filter((m: Record<string, unknown>) => {
        const supportedMethods = m.supportedGenerationMethods as string[] | undefined;
        return supportedMethods?.includes('generateContent');
      })
      .map((m: Record<string, unknown>) => {
        const name = m.name as string;
        const modelId = name.replace('models/', '');
        return {
          id: modelId,
          name: m.displayName || formatGeminiModelName(modelId),
          contextLength: m.inputTokenLimit || 1048576,
          pricing: {
            prompt: 0,
            completion: 0,
          },
        };
      })
      .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

    return NextResponse.json({ models });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch models';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function formatGeminiModelName(modelId: string): string {
  const nameMap: Record<string, string> = {
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemini-2.5-flash-lite-preview-06-17': 'Gemini 2.5 Flash Lite Preview',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gemini-2.5-pro-preview-06-05': 'Gemini 2.5 Pro Preview',
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'gemini-2.0-flash-lite': 'Gemini 2.0 Flash Lite',
    'gemini-1.5-flash': 'Gemini 1.5 Flash',
    'gemini-1.5-flash-8b': 'Gemini 1.5 Flash 8B',
    'gemini-1.5-pro': 'Gemini 1.5 Pro',
    'gemini-1.0-pro': 'Gemini 1.0 Pro',
  };

  if (nameMap[modelId]) {
    return nameMap[modelId];
  }

  return modelId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
