import { type NextRequest, NextResponse } from 'next/server';

interface ChutesModel {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  owner?: {
    username: string;
  };
  standard_template?: string;
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  try {
    const response = await fetch('https://api.chutes.ai/chutes/?include_public=true&template=vllm&limit=50', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch models';
      try {
        const error = await response.json();
        errorMessage = error.error?.message || error.message || error.detail || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    const data = await response.json();

    const chutes = data.items || data.chutes || data || [];
    
    const models = chutes
      .filter((chute: ChutesModel) => {
        return chute.standard_template === 'vllm' || chute.standard_template === 'sglang';
      })
      .map((chute: ChutesModel) => ({
        id: `${chute.owner?.username || 'chutes'}/${chute.slug || chute.name}`,
        name: formatChutesModelName(chute.name, chute.owner?.username),
        contextLength: 32768,
        pricing: {
          prompt: 0,
          completion: 0,
        },
        tagline: chute.tagline,
      }))
      .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));

    if (models.length === 0) {
      return NextResponse.json({ 
        models: getDefaultChutesModels() 
      });
    }

    return NextResponse.json({ models });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch models';
    return NextResponse.json({ 
      models: getDefaultChutesModels(),
      warning: message 
    });
  }
}

function formatChutesModelName(name: string, owner?: string): string {
  const cleanName = name
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  if (owner && owner !== 'chutesai') {
    return `${cleanName} (${owner})`;
  }
  
  return cleanName;
}

function getDefaultChutesModels() {
  return [
    {
      id: 'chutesai/Mistral-Small-3.1-24B-Instruct-2503',
      name: 'Mistral Small 3.1 24B Instruct',
      contextLength: 32768,
      pricing: { prompt: 0.03, completion: 0.11 },
    },
    {
      id: 'chutesai/Qwen3-32B',
      name: 'Qwen 3 32B',
      contextLength: 32768,
      pricing: { prompt: 0.08, completion: 0.24 },
    },
    {
      id: 'chutesai/DeepSeek-V3',
      name: 'DeepSeek V3',
      contextLength: 65536,
      pricing: { prompt: 0.30, completion: 1.20 },
    },
    {
      id: 'chutesai/DeepSeek-V3-0324',
      name: 'DeepSeek V3 0324 TEE',
      contextLength: 65536,
      pricing: { prompt: 0.19, completion: 0.87 },
    },
    {
      id: 'chutesai/Mistral-Nemo-Instruct-2407',
      name: 'Mistral Nemo Instruct 2407',
      contextLength: 32768,
      pricing: { prompt: 0.02, completion: 0.04 },
    },
    {
      id: 'chutesai/DeepSeek-R1',
      name: 'DeepSeek R1',
      contextLength: 65536,
      pricing: { prompt: 0.30, completion: 1.20 },
    },
    {
      id: 'chutesai/Qwen3-235B-A22B-Instruct-2507',
      name: 'Qwen 3 235B Instruct TEE',
      contextLength: 32768,
      pricing: { prompt: 0.08, completion: 0.55 },
    },
    {
      id: 'chutesai/GPT-OSS-120B',
      name: 'GPT OSS 120B TEE',
      contextLength: 32768,
      pricing: { prompt: 0.04, completion: 0.18 },
    },
  ];
}
