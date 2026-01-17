import { type NextRequest, NextResponse } from 'next/server';

interface FireworksApiModel {
  name: string;
  displayName?: string;
  description?: string;
  contextLength?: number;
  supportsImageInput?: boolean;
  supportsTools?: boolean;
  supportsServerless?: boolean;
  state?: string;
  kind?: string;
  public?: boolean;
  deployedModelRefs?: Array<{
    name?: string;
    deployment?: string;
    state?: string;
    default?: boolean;
    public?: boolean;
  }>;
}

interface FireworksApiResponse {
  models?: FireworksApiModel[];
  nextPageToken?: string;
  totalSize?: number;
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key');

  if (!apiKey) {
    return NextResponse.json({ error: 'API key required' }, { status: 401 });
  }

  try {
    const allModels: FireworksApiModel[] = [];
    let pageToken: string | undefined;
    let hasMore = true;
    let pageCount = 0;
    const maxPages = 10;

    while (hasMore && pageCount < maxPages) {
      const url = new URL('https://api.fireworks.ai/v1/accounts/fireworks/models');
      url.searchParams.set('pageSize', '200');
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const response = await fetch(url.toString(), {
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
        
        if (allModels.length === 0) {
          return NextResponse.json({ 
            models: getDefaultFireworksModels(),
            warning: errorMessage 
          });
        }
        break;
      }

      const data: FireworksApiResponse = await response.json();
      
      if (data.models && data.models.length > 0) {
        allModels.push(...data.models);
      }

      if (data.nextPageToken) {
        pageToken = data.nextPageToken;
        pageCount++;
      } else {
        hasMore = false;
      }
    }

    const filteredModels = allModels
      .filter((m: FireworksApiModel) => {
        if (m.supportsServerless === false) {
          return false;
        }
        
        const kindLower = m.kind?.toLowerCase() || '';
        if (kindLower.includes('embedding') || kindLower.includes('image_gen')) {
          return false;
        }
        
        const nameLower = m.name.toLowerCase();
        if (nameLower.includes('embedding') || 
            nameLower.includes('whisper') ||
            nameLower.includes('flux') ||
            nameLower.includes('stable-diffusion') ||
            nameLower.includes('sdxl') ||
            nameLower.includes('playground-v')) {
          return false;
        }
        
        return true;
      })
      .map((m: FireworksApiModel) => {
        const modelId = m.name.startsWith('accounts/') 
          ? m.name 
          : `accounts/fireworks/models/${m.name}`;
        
        return {
          id: modelId,
          name: m.displayName || formatFireworksModelName(modelId),
          contextLength: m.contextLength || 32768,
          description: m.description || undefined,
          supportsImageInput: m.supportsImageInput || false,
          supportsTools: m.supportsTools || false,
          pricing: {
            prompt: 0,
            completion: 0,
          },
        };
      })
      .sort((a, b) => {
        const priorityOrder = [
          'deepseek-v3', 'deepseek-r1', 'kimi-k2',
          'qwen3', 'qwen2', 
          'llama-v3p3', 'llama-v3p2', 'llama-v3p1', 'llama4',
          'mistral', 'gemma'
        ];
        
        const aIndex = priorityOrder.findIndex(p => a.id.toLowerCase().includes(p));
        const bIndex = priorityOrder.findIndex(p => b.id.toLowerCase().includes(p));
        
        const aPriority = aIndex === -1 ? 999 : aIndex;
        const bPriority = bIndex === -1 ? 999 : bIndex;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return a.name.localeCompare(b.name);
      });

    if (filteredModels.length === 0) {
      return NextResponse.json({ 
        models: getDefaultFireworksModels() 
      });
    }

    return NextResponse.json({ 
      models: filteredModels,
      totalCount: filteredModels.length 
    });
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
      id: 'accounts/fireworks/models/deepseek-v3p1',
      name: 'DeepSeek V3.1',
      contextLength: 163840,
      pricing: { prompt: 0.56, completion: 1.68 },
    },
    {
      id: 'accounts/fireworks/models/deepseek-v3p2',
      name: 'DeepSeek V3.2',
      contextLength: 163840,
      pricing: { prompt: 0.56, completion: 1.68 },
    },
    {
      id: 'accounts/fireworks/models/kimi-k2-instruct-0905',
      name: 'Kimi K2 0905',
      contextLength: 131072,
      pricing: { prompt: 0.6, completion: 2.5 },
    },
    {
      id: 'accounts/fireworks/models/qwen3-235b-a22b',
      name: 'Qwen3 235B A22B',
      contextLength: 131072,
      pricing: { prompt: 0.9, completion: 0.9 },
    },
    {
      id: 'accounts/fireworks/models/qwen3-coder-30b-a3b-instruct',
      name: 'Qwen3 Coder 30B A3B',
      contextLength: 131072,
      pricing: { prompt: 0.2, completion: 0.2 },
    },
    {
      id: 'accounts/fireworks/models/qwen2p5-coder-32b-instruct',
      name: 'Qwen2.5-32B-Coder',
      contextLength: 131072,
      pricing: { prompt: 0.9, completion: 0.9 },
    },
    {
      id: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
      name: 'Llama 3.3 70B Instruct',
      contextLength: 131072,
      pricing: { prompt: 0.9, completion: 0.9 },
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
      id: 'accounts/fireworks/models/llama4-maverick-instruct-basic',
      name: 'Llama 4 Maverick Basic',
      contextLength: 131072,
      pricing: { prompt: 0.22, completion: 0.88 },
    },
    {
      id: 'accounts/fireworks/models/glm-4p6',
      name: 'GLM 4.6',
      contextLength: 131072,
      pricing: { prompt: 0.9, completion: 0.9 },
    },
    {
      id: 'accounts/fireworks/models/mistral-codestral-22b-v0p1',
      name: 'Mistral Codestral 22B',
      contextLength: 32768,
      pricing: { prompt: 0.9, completion: 0.9 },
    },
    {
      id: 'accounts/fireworks/models/qwen3-14b',
      name: 'Qwen3 14B',
      contextLength: 131072,
      pricing: { prompt: 0.2, completion: 0.2 },
    },
    {
      id: 'accounts/fireworks/models/qwen3-8b',
      name: 'Qwen3 8B',
      contextLength: 131072,
      pricing: { prompt: 0.2, completion: 0.2 },
    },
    {
      id: 'accounts/fireworks/models/gpt-oss-120b',
      name: 'GPT-OSS-120B',
      contextLength: 131072,
      pricing: { prompt: 0.9, completion: 0.9 },
    },
  ];
}
