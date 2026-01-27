import type { NextRequest } from 'next/server';
import { STEP_EXECUTION_SYSTEM_PROMPT, buildSystemPrompt } from '@/lib/systemPrompt';

type Provider = 'openrouter' | 'groq' | 'cohere' | 'chutes' | 'fireworks' | 'cerebras' | 'huggingface' | 'gemini' | 'mistral' | 'deepseek' | 'openai' | 'anthropic' | 'zai';

function getApiEndpoint(provider: Provider): string {
  const endpoints: Record<Provider, string> = {
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    cohere: 'https://api.cohere.com/v2/chat',
    chutes: 'https://api.chutes.ai/v1/chat/completions',
    fireworks: 'https://api.fireworks.ai/inference/v1/chat/completions',
    cerebras: 'https://api.cerebras.ai/v1/chat/completions',
    huggingface: 'https://router.huggingface.co/v1/chat/completions',
    mistral: 'https://api.mistral.ai/v1/chat/completions',
    deepseek: 'https://api.deepseek.com/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    zai: 'https://api.z.ai/api/paas/v4/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    gemini: '',
    anthropic: '',
  };
  return endpoints[provider] || endpoints.openrouter;
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

interface PlanStep {
  title: string;
  description: string;
  status: string;
  result?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      goal,
      currentStep,
      stepNumber,
      totalSteps,
      previousSteps,
      model,
      apiKey,
      provider = 'openrouter',
      temperature,
      maxTokens,
      fileContext,
      systemInstruction,
    } = body;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const basePrompt = buildSystemPrompt(systemInstruction, fileContext);
    
    const stepExecutionContext = `
${STEP_EXECUTION_SYSTEM_PROMPT}

---

## OVERALL GOAL
${goal}

## CURRENT STEP (${stepNumber} of ${totalSteps})
**${currentStep.title}**
${currentStep.description}

${previousSteps && previousSteps.length > 0 ? `
## COMPLETED STEPS
${previousSteps.map((step: PlanStep, idx: number) => `
Step ${idx + 1}: ${step.title} ✓
${step.result ? `Result: ${step.result}` : ''}
`).join('\n')}
` : ''}

---

Focus ONLY on completing Step ${stepNumber}: "${currentStep.title}"
`;

    const fullSystemPrompt = `${stepExecutionContext}

${basePrompt}`;

    const userMessage = `Execute Step ${stepNumber}: ${currentStep.title}

${currentStep.description}

Write the code now. Start with a brief explanation, then use file markers.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let response: Response;

          if (provider === 'gemini') {
            response = await handleGeminiRequest(userMessage, model, apiKey, fullSystemPrompt, temperature, maxTokens);
          } else if (provider === 'anthropic') {
            response = await handleAnthropicRequest(userMessage, model, apiKey, fullSystemPrompt, temperature, maxTokens);
          } else if (provider === 'cohere') {
            response = await handleCohereRequest(userMessage, model, apiKey, fullSystemPrompt, temperature, maxTokens);
          } else {
            response = await fetch(getApiEndpoint(provider), {
              method: 'POST',
              headers: getApiHeaders(provider, apiKey),
              body: JSON.stringify({
                model,
                messages: [
                  { role: 'system', content: fullSystemPrompt },
                  { role: 'user', content: userMessage },
                ],
                stream: true,
                temperature: temperature ?? 0.7,
                max_tokens: maxTokens ?? 8192,
              }),
            });
          }

          if (!response.ok) {
            let errorMessage = 'API error';
            try {
              const error = await response.json();
              errorMessage = error.error?.message || error.message || 'API error';
            } catch {
              errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`)
            );
            controller.close();
            return;
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'No response body' })}\n\n`)
            );
            controller.close();
            return;
          }

          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

              const data = trimmedLine.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                let content = '';

                if (provider === 'gemini') {
                  content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  if (parsed.candidates?.[0]?.finishReason === 'STOP') {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                  }
                } else if (provider === 'anthropic') {
                  if (parsed.type === 'content_block_delta') {
                    content = parsed.delta?.text || '';
                  } else if (parsed.type === 'message_stop') {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                    continue;
                  }
                } else if (provider === 'cohere') {
                  if (parsed.type === 'content-delta') {
                    content = parsed.delta?.message?.content?.text || '';
                  } else if (parsed.type === 'message-end') {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                    continue;
                  }
                } else {
                  content = parsed.choices?.[0]?.delta?.content || '';
                }

                if (content) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'token', content })}\n\n`)
                  );
                }

                if (parsed.error) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'error', message: parsed.error.message })}\n\n`)
                  );
                }
              } catch {
                // Ignore parse errors
              }
            }
          }

          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Connection error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleGeminiRequest(
  userContent: string,
  model: string,
  apiKey: string,
  systemPrompt: string,
  temperature?: number,
  maxTokens?: number
): Promise<Response> {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { 
          temperature: temperature ?? 0.7, 
          maxOutputTokens: maxTokens ?? 8192 
        },
      }),
    }
  );
}

async function handleAnthropicRequest(
  userContent: string,
  model: string,
  apiKey: string,
  systemPrompt: string,
  temperature?: number,
  maxTokens?: number
): Promise<Response> {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens ?? 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
      stream: true,
      temperature: temperature ?? 0.7,
    }),
  });
}

async function handleCohereRequest(
  userContent: string,
  model: string,
  apiKey: string,
  systemPrompt: string,
  temperature?: number,
  maxTokens?: number
): Promise<Response> {
  return fetch('https://api.cohere.com/v2/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      stream: true,
      temperature: temperature ?? 0.3,
      max_tokens: maxTokens ?? 8192,
    }),
  });
}
