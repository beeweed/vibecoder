import { type NextRequest, NextResponse } from 'next/server';

const ZAI_MODELS = [
  {
    id: 'glm-4.7',
    name: 'GLM-4.7',
    contextLength: 128000,
    pricing: { prompt: 0, completion: 0 },
  },
  {
    id: 'glm-4.5',
    name: 'GLM-4.5',
    contextLength: 128000,
    pricing: { prompt: 0, completion: 0 },
  },
  {
    id: 'glm-4.5-air',
    name: 'GLM-4.5 Air',
    contextLength: 128000,
    pricing: { prompt: 0, completion: 0 },
  },
  {
    id: 'glm-4.5-flash',
    name: 'GLM-4.5 Flash',
    contextLength: 128000,
    pricing: { prompt: 0, completion: 0 },
  },
  {
    id: 'glm-4.6v',
    name: 'GLM-4.6V (Vision)',
    contextLength: 128000,
    pricing: { prompt: 0, completion: 0 },
  },
  {
    id: 'glm-4-32b-0414-128k',
    name: 'GLM-4 32B 128K',
    contextLength: 128000,
    pricing: { prompt: 0, completion: 0 },
  },
];

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  return NextResponse.json({ models: ZAI_MODELS });
}
