import { type NextRequest, NextResponse } from 'next/server';

interface FireworksModel {
  id: string;
  object: string;
  owned_by?: string;
  context_length?: number;
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  try {
    const response = await fetch('https://api.fireworks.ai/inference/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
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

    const modelsList = data.data || data || [];
    
    const models = modelsList
      .filter((m: FireworksModel) => {
        const id = m.id || '';
        return id.includes('instruct') || 
               id.includes('chat') || 
               id.includes('llama') ||
               id.includes('deepseek') ||
               id.includes('qwen') ||
               id.includes('mistral') ||
               id.includes('gemma') ||
               id.includes('coder');
      })
      .map((m: FireworksModel) => ({
        id: m.id,
        name: formatFireworksModelName(m.id),
        contextLength: m.context_length || 32768,
        pricing: {
          prompt: 0,
          completion: 0,
        },
      }))
      .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

    if (models.length === 0) {
      return NextResponse.json({ 
        models: getDefaultFireworksModels() 
      });
    }

    return NextResponse.json({ models });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch models';
    return NextResponse.json({ 
      models: getDefaultFireworksModels(),
      warning: message 
    });
  }
}

function formatFireworksModelName(modelId: string): string {
  const nameMap: Record<string, string> = {
    'accounts/fireworks/models/llama-v3p1-405b-instruct': 'Llama 3.1 405B Instruct',
    'accounts/fireworks/models/llama-v3p1-70b-instruct': 'Llama 3.1 70B Instruct',
    'accounts/fireworks/models/llama-v3p1-8b-instruct': 'Llama 3.1 8B Instruct',
    'accounts/fireworks/models/llama-v3p3-70b-instruct': 'Llama 3.3 70B Instruct',
    'accounts/fireworks/models/deepseek-v3': 'DeepSeek V3',
    'accounts/fireworks/models/deepseek-v3p1': 'DeepSeek V3.1',
    'accounts/fireworks/models/deepseek-r1': 'DeepSeek R1',
    'accounts/fireworks/models/deepseek-r1-basic': 'DeepSeek R1 Basic',
    'accounts/fireworks/models/qwen3-coder-480b-a35b-instruct': 'Qwen 3 Coder 480B',
    'accounts/fireworks/models/mistral-small-24b-instruct-2501': 'Mistral Small 24B',
    'accounts/fireworks/models/gemma2-9b-it': 'Gemma 2 9B IT',
  };

  if (nameMap[modelId]) {
    return nameMap[modelId];
  }

  const cleanId = modelId
    .replace('accounts/fireworks/models/', '')
    .replace('accounts/', '')
    .replace('/models/', ' ');
  
  return cleanId
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/V(\d)/g, 'V$1')
    .replace(/P(\d)/g, '.$1')
    .replace(/(\d)b/gi, '$1B');
}

function getDefaultFireworksModels() {
  return [
    {
      id: 'accounts/fireworks/models/llama-v3p1-405b-instruct',
      name: 'Llama 3.1 405B Instruct',
      contextLength: 131072,
      pricing: { prompt: 3.0, completion: 3.0 },
    },
    {
      id: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
      name: 'Llama 3.1 70B Instruct',
      contextLength: 131072,
      pricing: { prompt: 0.9, completion: 0.9 },
    },
    {
      id: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
      name: 'Llama 3.1 8B Instruct',
      contextLength: 131072,
      pricing: { prompt: 0.2, completion: 0.2 },
    },
    {
      id: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
      name: 'Llama 3.3 70B Instruct',
      contextLength: 131072,
      pricing: { prompt: 0.9, completion: 0.9 },
    },
    {
      id: 'accounts/fireworks/models/deepseek-v3',
      name: 'DeepSeek V3',
      contextLength: 131072,
      pricing: { prompt: 0.9, completion: 0.9 },
    },
    {
      id: 'accounts/fireworks/models/deepseek-v3p1',
      name: 'DeepSeek V3.1',
      contextLength: 163840,
      pricing: { prompt: 0.56, completion: 1.68 },
    },
    {
      id: 'accounts/fireworks/models/deepseek-r1',
      name: 'DeepSeek R1',
      contextLength: 163840,
      pricing: { prompt: 1.35, completion: 5.4 },
    },
    {
      id: 'accounts/fireworks/models/qwen3-coder-480b-a35b-instruct',
      name: 'Qwen 3 Coder 480B',
      contextLength: 262144,
      pricing: { prompt: 0.45, completion: 1.8 },
    },
    {
      id: 'accounts/fireworks/models/mistral-small-24b-instruct-2501',
      name: 'Mistral Small 24B',
      contextLength: 32768,
      pricing: { prompt: 0.9, completion: 0.9 },
    },
    {
      id: 'accounts/fireworks/models/gemma2-9b-it',
      name: 'Gemma 2 9B IT',
      contextLength: 8192,
      pricing: { prompt: 0.2, completion: 0.2 },
    },
    {
      id: 'accounts/fireworks/models/firefunction-v2',
      name: 'FireFunction V2',
      contextLength: 32768,
      pricing: { prompt: 0.9, completion: 0.9 },
    },
    {
      id: 'accounts/fireworks/models/kimi-k2-instruct',
      name: 'Kimi K2 Instruct',
      contextLength: 131072,
      pricing: { prompt: 0.6, completion: 2.5 },
    },
  ];
}
