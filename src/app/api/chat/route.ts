import type { NextRequest } from 'next/server';
import { buildSystemPrompt } from '@/lib/systemPrompt';

type Provider = 'openrouter' | 'groq';

function getApiEndpoint(provider: Provider): string {
  if (provider === 'groq') {
    return 'https://api.groq.com/openai/v1/chat/completions';
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages,
      model,
      apiKey,
      temperature,
      maxTokens,
      systemInstruction,
      fileContext,
      provider = 'openrouter',
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

    const systemPrompt = buildSystemPrompt(systemInstruction, fileContext);

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch(
            getApiEndpoint(provider),
            {
              method: 'POST',
              headers: getApiHeaders(provider, apiKey),
              body: JSON.stringify({
                model,
                messages: apiMessages,
                stream: true,
                temperature: temperature ?? 0.7,
                max_tokens: maxTokens ?? 8192,
              }),
            }
          );

          if (!response.ok) {
            let errorMessage = 'API error';
            try {
              const error = await response.json();
              errorMessage = error.error?.message || error.message || 'API error';
            } catch {
              errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'error', message: errorMessage })}\n\n`
              )
            );
            controller.close();
            return;
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'error', message: 'No response body' })}\n\n`
              )
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
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'done' })}\n\n`
                  )
                );
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'token', content })}\n\n`
                    )
                  );
                }
                if (parsed.usage) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'usage', usage: parsed.usage })}\n\n`
                    )
                  );
                }
                if (parsed.error) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'error', message: parsed.error.message })}\n\n`
                    )
                  );
                }
              } catch {
                // Ignore parse errors for malformed chunks
              }
            }
          }

          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Connection error';
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message })}\n\n`
            )
          );
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
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
