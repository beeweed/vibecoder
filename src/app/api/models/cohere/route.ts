import { type NextRequest, NextResponse } from 'next/server';

const COHERE_MODELS = [
  {
    id: 'command-a-03-2025',
    name: 'Command A (Latest)',
    contextLength: 256000,
    description: 'Most performant model - excels at tool use, agents, RAG',
  },
  {
    id: 'command-r-plus-08-2024',
    name: 'Command R+ (Aug 2024)',
    contextLength: 128000,
    description: 'Best for complex RAG workflows and multi-step tool use',
  },
  {
    id: 'command-r-08-2024',
    name: 'Command R (Aug 2024)',
    contextLength: 128000,
    description: 'Instruction-following for code generation, RAG, agents',
  },
  {
    id: 'command-r7b-12-2024',
    name: 'Command R 7B (Dec 2024)',
    contextLength: 128000,
    description: 'Small, fast model for RAG, tool use, and reasoning',
  },
  {
    id: 'c4ai-aya-expanse-32b',
    name: 'Aya Expanse 32B',
    contextLength: 128000,
    description: 'Multilingual model supporting 23 languages',
  },
  {
    id: 'c4ai-aya-expanse-8b',
    name: 'Aya Expanse 8B',
    contextLength: 8000,
    description: 'Fast multilingual model for 23 languages',
  },
];

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  try {
    const response = await fetch('https://api.cohere.com/v2/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
      }
      const models = COHERE_MODELS.map((m) => ({
        id: m.id,
        name: m.name,
        contextLength: m.contextLength,
        pricing: { prompt: 0, completion: 0 },
      }));
      return NextResponse.json({ models });
    }

    const data = await response.json();
    
    const chatModels = data.models
      ?.filter((m: Record<string, unknown>) => {
        const endpoints = m.endpoints as string[] | undefined;
        return endpoints?.includes('chat');
      })
      .map((m: Record<string, unknown>) => ({
        id: m.name,
        name: formatCohereModelName(m.name as string),
        contextLength: m.context_length || 128000,
        pricing: { prompt: 0, completion: 0 },
      }))
      .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

    if (chatModels && chatModels.length > 0) {
      return NextResponse.json({ models: chatModels });
    }

    const fallbackModels = COHERE_MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      contextLength: m.contextLength,
      pricing: { prompt: 0, completion: 0 },
    }));
    return NextResponse.json({ models: fallbackModels });
  } catch (error) {
    const fallbackModels = COHERE_MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      contextLength: m.contextLength,
      pricing: { prompt: 0, completion: 0 },
    }));
    return NextResponse.json({ models: fallbackModels });
  }
}

function formatCohereModelName(modelId: string): string {
  const nameMap: Record<string, string> = {
    'command-a-03-2025': 'Command A (Latest)',
    'command-r-plus-08-2024': 'Command R+ (Aug 2024)',
    'command-r-08-2024': 'Command R (Aug 2024)',
    'command-r7b-12-2024': 'Command R 7B (Dec 2024)',
    'command-r-plus-04-2024': 'Command R+ (Apr 2024)',
    'command-r-03-2024': 'Command R (Mar 2024)',
    'command-r-plus': 'Command R+',
    'command-r': 'Command R',
    'c4ai-aya-expanse-32b': 'Aya Expanse 32B',
    'c4ai-aya-expanse-8b': 'Aya Expanse 8B',
    'c4ai-aya-vision-32b': 'Aya Vision 32B',
    'c4ai-aya-vision-8b': 'Aya Vision 8B',
    'command-a-translate-08-2025': 'Command A Translate',
    'command-a-reasoning-08-2025': 'Command A Reasoning',
    'command-a-vision-07-2025': 'Command A Vision',
  };

  if (nameMap[modelId]) {
    return nameMap[modelId];
  }

  return modelId
    .replace(/^(c4ai-|command-)/, '')
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
