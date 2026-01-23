import type { NextRequest } from 'next/server';
import { buildSystemPrompt, FILE_READ_TOOL_DEFINITION } from '@/lib/systemPrompt';

type Provider = 'openrouter' | 'groq' | 'cohere' | 'chutes' | 'fireworks' | 'cerebras' | 'huggingface' | 'gemini' | 'mistral' | 'deepseek' | 'openai' | 'anthropic' | 'zai';

function getApiEndpoint(provider: Provider, model?: string): string {
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
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
}

interface FileContents {
  [path: string]: string;
}

function executeFileReadTool(path: string, fileContents: FileContents): string {
  if (fileContents[path]) {
    return fileContents[path];
  }
  return `[File not found: ${path}]`;
}

function formatMessagesForCohere(messages: Message[], systemPrompt: string): { messages: Array<{ role: string; content: string }> } {
  const cohereMessages: Array<{ role: string; content: string }> = [];
  
  cohereMessages.push({
    role: 'system',
    content: systemPrompt,
  });

  for (const msg of messages) {
    const role = msg.role === 'assistant' ? 'assistant' : 'user';
    cohereMessages.push({
      role,
      content: msg.content || '',
    });
  }

  return { messages: cohereMessages };
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
      fileStructure,
      fileContents = {},
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

    const systemPrompt = buildSystemPrompt(systemInstruction, fileStructure);

    if (provider === 'cohere') {
      return handleCohereChat(messages, model, apiKey, systemPrompt, temperature, maxTokens);
    }

    if (provider === 'gemini') {
      return handleGeminiChat(messages, model, apiKey, systemPrompt, temperature, maxTokens);
    }

    if (provider === 'anthropic') {
      return handleAnthropicChatWithTools(messages, model, apiKey, systemPrompt, temperature, maxTokens, fileContents);
    }

    return handleOpenAICompatibleChatWithTools(
      messages, model, apiKey, systemPrompt, temperature, maxTokens, fileContents, provider
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleOpenAICompatibleChatWithTools(
  messages: Message[],
  model: string,
  apiKey: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
  fileContents: FileContents,
  provider: Provider
): Promise<Response> {
  const encoder = new TextEncoder();
  const hasFiles = Object.keys(fileContents).length > 0;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const conversationMessages: Message[] = [
          { role: 'system', content: systemPrompt },
          ...messages,
        ];
        
        let continueLoop = true;
        const maxIterations = 10;
        let iteration = 0;

        while (continueLoop && iteration < maxIterations) {
          iteration++;
          
          const requestBody: Record<string, unknown> = {
            model,
            messages: conversationMessages,
            stream: true,
            temperature: temperature ?? 0.7,
            max_tokens: maxTokens ?? 8192,
          };

          if (hasFiles) {
            requestBody.tools = [FILE_READ_TOOL_DEFINITION];
            requestBody.tool_choice = 'auto';
          }

          const response = await fetch(
            getApiEndpoint(provider),
            {
              method: 'POST',
              headers: getApiHeaders(provider, apiKey),
              body: JSON.stringify(requestBody),
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
          let assistantContent = '';
          const currentToolCalls: Array<{
            id: string;
            type: string;
            function: { name: string; arguments: string };
          }> = [];
          let hasToolCalls = false;

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
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;
                const finishReason = parsed.choices?.[0]?.finish_reason;

                if (delta?.content) {
                  assistantContent += delta.content;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'token', content: delta.content })}\n\n`
                    )
                  );
                }

                if (delta?.tool_calls) {
                  hasToolCalls = true;
                  for (const toolCall of delta.tool_calls) {
                    const index = toolCall.index ?? 0;
                    if (!currentToolCalls[index]) {
                      currentToolCalls[index] = {
                        id: toolCall.id || '',
                        type: toolCall.type || 'function',
                        function: { name: '', arguments: '' }
                      };
                    }
                    if (toolCall.id) {
                      currentToolCalls[index].id = toolCall.id;
                    }
                    if (toolCall.function?.name) {
                      currentToolCalls[index].function.name = toolCall.function.name;
                    }
                    if (toolCall.function?.arguments) {
                      currentToolCalls[index].function.arguments += toolCall.function.arguments;
                    }
                  }
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

                if (finishReason === 'stop') {
                  continueLoop = false;
                } else if (finishReason === 'tool_calls') {
                  continueLoop = true;
                }
              } catch {
                // Ignore parse errors
              }
            }
          }

          if (hasToolCalls && currentToolCalls.length > 0) {
            const assistantMessage: Message = {
              role: 'assistant',
              content: assistantContent || null,
              tool_calls: currentToolCalls.filter(tc => tc.id),
            };
            conversationMessages.push(assistantMessage);

            for (const toolCall of currentToolCalls) {
              if (!toolCall.id || !toolCall.function.name) continue;

              if (toolCall.function.name === 'file_read') {
                try {
                  const args = JSON.parse(toolCall.function.arguments);
                  const filePath = args.path;

                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'tool_call', tool: 'file_read', path: filePath })}\n\n`
                    )
                  );

                  const fileContent = executeFileReadTool(filePath, fileContents);

                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'tool_result', tool: 'file_read', path: filePath, success: !fileContent.startsWith('[File not found') })}\n\n`
                    )
                  );

                  conversationMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: fileContent,
                  } as Message);
                } catch (e) {
                  conversationMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: `Error parsing tool arguments: ${e instanceof Error ? e.message : 'Unknown error'}`,
                  } as Message);
                }
              }
            }
          } else {
            continueLoop = false;
          }
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'done' })}\n\n`
          )
        );
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
}

async function handleCohereChat(
  messages: Message[],
  model: string,
  apiKey: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<Response> {
  const encoder = new TextEncoder();
  
  const cohereMessages = formatMessagesForCohere(messages, systemPrompt);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch('https://api.cohere.com/v2/chat', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: cohereMessages.messages,
            stream: true,
            temperature: temperature ?? 0.3,
            max_tokens: maxTokens ?? 8192,
          }),
        });

        if (!response.ok) {
          let errorMessage = 'Cohere API error';
          try {
            const error = await response.json();
            errorMessage = error.message || error.error?.message || 'API error';
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
              
              if (parsed.type === 'content-delta') {
                const content = parsed.delta?.message?.content?.text;
                if (content) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'token', content })}\n\n`
                    )
                  );
                }
              } else if (parsed.type === 'message-end') {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'done' })}\n\n`
                  )
                );
              } else if (parsed.type === 'error' || parsed.error) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'error', message: parsed.message || parsed.error?.message || 'Unknown error' })}\n\n`
                  )
                );
              }
            } catch {
              // Ignore parse errors
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
}

async function handleGeminiChat(
  messages: Message[],
  model: string,
  apiKey: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<Response> {
  const encoder = new TextEncoder();

  const geminiContents = formatMessagesForGemini(messages);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: geminiContents,
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              generationConfig: {
                temperature: temperature ?? 0.7,
                maxOutputTokens: maxTokens ?? 8192,
              },
            }),
          }
        );

        if (!response.ok) {
          let errorMessage = 'Gemini API error';
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
              
              const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (content) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'token', content })}\n\n`
                  )
                );
              }

              if (parsed.candidates?.[0]?.finishReason === 'STOP') {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'done' })}\n\n`
                  )
                );
              }

              if (parsed.error) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'error', message: parsed.error.message || 'Unknown error' })}\n\n`
                  )
                );
              }
            } catch {
              // Ignore parse errors
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
}

function formatMessagesForGemini(messages: Message[]): Array<{ role: string; parts: Array<{ text: string }> }> {
  const geminiMessages: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const msg of messages) {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    geminiMessages.push({
      role,
      parts: [{ text: msg.content || '' }],
    });
  }

  return geminiMessages;
}

async function handleAnthropicChatWithTools(
  messages: Message[],
  model: string,
  apiKey: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
  fileContents: FileContents
): Promise<Response> {
  const encoder = new TextEncoder();
  const hasFiles = Object.keys(fileContents).length > 0;

  const anthropicTool = hasFiles ? {
    name: 'file_read',
    description: 'Read the contents of a specific file from the project. Use this tool when you need to see the current content of an existing file before modifying it or understanding its structure.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The full path to the file to read (e.g., "src/components/Button.tsx")'
        }
      },
      required: ['path']
    }
  } : null;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const conversationMessages = messages.map((msg) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        }));

        let continueLoop = true;
        const maxIterations = 10;
        let iteration = 0;

        while (continueLoop && iteration < maxIterations) {
          iteration++;

          const requestBody: Record<string, unknown> = {
            model,
            max_tokens: maxTokens ?? 8192,
            system: systemPrompt,
            messages: conversationMessages,
            stream: true,
            temperature: temperature ?? 0.7,
          };

          if (anthropicTool) {
            requestBody.tools = [anthropicTool];
          }

          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            let errorMessage = 'Anthropic API error';
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
          let currentToolUse: { id: string; name: string; input: string } | null = null;
          let assistantContent = '';
          let hasToolUse = false;
          let stopReason = '';

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
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === 'content_block_start') {
                  if (parsed.content_block?.type === 'tool_use') {
                    hasToolUse = true;
                    currentToolUse = {
                      id: parsed.content_block.id,
                      name: parsed.content_block.name,
                      input: ''
                    };
                  }
                } else if (parsed.type === 'content_block_delta') {
                  if (parsed.delta?.type === 'text_delta') {
                    const content = parsed.delta.text;
                    if (content) {
                      assistantContent += content;
                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({ type: 'token', content })}\n\n`
                        )
                      );
                    }
                  } else if (parsed.delta?.type === 'input_json_delta' && currentToolUse) {
                    currentToolUse.input += parsed.delta.partial_json || '';
                  }
                } else if (parsed.type === 'content_block_stop' && currentToolUse) {
                  if (currentToolUse.name === 'file_read') {
                    try {
                      const args = JSON.parse(currentToolUse.input);
                      const filePath = args.path;

                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({ type: 'tool_call', tool: 'file_read', path: filePath })}\n\n`
                        )
                      );

                      const fileContent = executeFileReadTool(filePath, fileContents);

                      controller.enqueue(
                        encoder.encode(
                          `data: ${JSON.stringify({ type: 'tool_result', tool: 'file_read', path: filePath, success: !fileContent.startsWith('[File not found') })}\n\n`
                        )
                      );

                      conversationMessages.push({
                        role: 'assistant',
                        content: [
                          ...(assistantContent ? [{ type: 'text', text: assistantContent }] : []),
                          { type: 'tool_use', id: currentToolUse.id, name: 'file_read', input: args }
                        ]
                      } as unknown as { role: string; content: string });

                      conversationMessages.push({
                        role: 'user',
                        content: [
                          { type: 'tool_result', tool_use_id: currentToolUse.id, content: fileContent }
                        ]
                      } as unknown as { role: string; content: string });

                      assistantContent = '';
                    } catch (e) {
                      // Error parsing tool input
                    }
                  }
                  currentToolUse = null;
                } else if (parsed.type === 'message_delta') {
                  stopReason = parsed.delta?.stop_reason || '';
                  if (parsed.usage) {
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: 'usage', usage: parsed.usage })}\n\n`
                      )
                    );
                  }
                } else if (parsed.type === 'message_stop') {
                  if (stopReason === 'end_turn') {
                    continueLoop = false;
                  } else if (stopReason === 'tool_use') {
                    continueLoop = true;
                  }
                } else if (parsed.type === 'error' || parsed.error) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: 'error', message: parsed.error?.message || parsed.message || 'Unknown error' })}\n\n`
                    )
                  );
                }
              } catch {
                // Ignore parse errors
              }
            }
          }

          if (!hasToolUse) {
            continueLoop = false;
          }
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'done' })}\n\n`
          )
        );
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
}
