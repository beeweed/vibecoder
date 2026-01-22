import type { NextRequest } from 'next/server';
import { THINKING_SYSTEM_PROMPT } from '@/lib/systemPrompt';

type Provider = 'openrouter' | 'groq' | 'cohere' | 'chutes' | 'fireworks' | 'cerebras' | 'huggingface' | 'gemini' | 'mistral' | 'deepseek' | 'openai' | 'anthropic' | 'zai';

function getApiEndpoint(provider: Provider): string {
  if (provider === 'groq') {
    return 'https://api.groq.com/openai/v1/chat/completions';
  }
  if (provider === 'cohere') {
    return 'https://api.cohere.com/v2/chat';
  }
  if (provider === 'chutes') {
    return 'https://api.chutes.ai/v1/chat/completions';
  }
  if (provider === 'fireworks') {
    return 'https://api.fireworks.ai/inference/v1/chat/completions';
  }
  if (provider === 'cerebras') {
    return 'https://api.cerebras.ai/v1/chat/completions';
  }
  if (provider === 'huggingface') {
    return 'https://router.huggingface.co/v1/chat/completions';
  }
  if (provider === 'mistral') {
    return 'https://api.mistral.ai/v1/chat/completions';
  }
  if (provider === 'deepseek') {
    return 'https://api.deepseek.com/chat/completions';
  }
  if (provider === 'openai') {
    return 'https://api.openai.com/v1/chat/completions';
  }
  if (provider === 'zai') {
    return 'https://api.z.ai/api/paas/v4/chat/completions';
  }
  return 'https://openrouter.ai/api/v1/chat/completions';
}

function getApiHeaders(provider: Provider, apiKey: string): Record<string, string> {
  const baseHeaders = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (provider === 'openrouter') {
    return {
      ...baseHeaders,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'VibeCoder',
    };
  }

  return baseHeaders;
}

interface Message {
  role: string;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userMessage,
      model,
      apiKey,
      provider = 'openrouter',
      fileContext,
    } = body;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!model) {
      return new Response(
        JSON.stringify({ error: 'Model is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const contextInfo = fileContext 
      ? `\n\nCurrent project structure:\n${fileContext}` 
      : '';

    const messages: Message[] = [
      { role: 'system', content: THINKING_SYSTEM_PROMPT },
      { role: 'user', content: userMessage + contextInfo },
    ];

    // For thinking, we use non-streaming for simplicity and to get clean JSON
    if (provider === 'gemini') {
      return handleGeminiThinking(messages, model, apiKey);
    }

    if (provider === 'anthropic') {
      return handleAnthropicThinking(messages, model, apiKey);
    }

    if (provider === 'cohere') {
      return handleCohereThinking(messages, model, apiKey);
    }

    // Default OpenAI-compatible providers
    const response = await fetch(getApiEndpoint(provider), {
      method: 'POST',
      headers: getApiHeaders(provider, apiKey),
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'API error';
      try {
        const error = await response.json();
        errorMessage = error.error?.message || error.message || 'API error';
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Return the reasoning text directly
    const reasoning = cleanReasoningResponse(content);

    return new Response(
      JSON.stringify({ reasoning }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

function cleanReasoningResponse(content: string): string {
  // Clean up the response - remove any JSON formatting if present
  let reasoning = content.trim();
  
  // Try to extract from JSON if wrapped
  try {
    const jsonMatch = reasoning.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.reasoning) {
        reasoning = parsed.reasoning;
      } else if (parsed.understanding) {
        reasoning = parsed.understanding;
      }
    }
  } catch {
    // Not JSON, use as-is
  }
  
  // Remove any markdown code blocks
  reasoning = reasoning.replace(/```[\s\S]*?```/g, '').trim();
  
  // Ensure we have something
  return reasoning || 'Understanding the request...';
}

async function handleGeminiThinking(
  messages: Message[],
  model: string,
  apiKey: string
): Promise<Response> {
  const geminiContents = messages
    .filter(m => m.role !== 'system')
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

  const systemMessage = messages.find(m => m.role === 'system');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiContents,
        systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!response.ok) {
    let errorMessage = 'Gemini API error';
    try {
      const error = await response.json();
      errorMessage = error.error?.message || 'API error';
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: response.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const reasoning = cleanReasoningResponse(content);

  return new Response(
    JSON.stringify({ reasoning }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

async function handleAnthropicThinking(
  messages: Message[],
  model: string,
  apiKey: string
): Promise<Response> {
  const systemMessage = messages.find(m => m.role === 'system');
  const anthropicMessages = messages
    .filter(m => m.role !== 'system')
    .map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemMessage?.content || THINKING_SYSTEM_PROMPT,
      messages: anthropicMessages,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Anthropic API error';
    try {
      const error = await response.json();
      errorMessage = error.error?.message || 'API error';
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: response.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || '';
  const reasoning = cleanReasoningResponse(content);

  return new Response(
    JSON.stringify({ reasoning }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

async function handleCohereThinking(
  messages: Message[],
  model: string,
  apiKey: string
): Promise<Response> {
  const cohereMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
    content: msg.content,
  }));

  const response = await fetch('https://api.cohere.com/v2/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: cohereMessages,
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Cohere API error';
    try {
      const error = await response.json();
      errorMessage = error.message || 'API error';
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: response.status, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const data = await response.json();
  const content = data.message?.content?.[0]?.text || '';
  const reasoning = cleanReasoningResponse(content);

  return new Response(
    JSON.stringify({ reasoning }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
