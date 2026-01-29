import type { NextRequest } from 'next/server';
import { buildSystemPrompt } from '@/lib/systemPrompt';
import type { ToolType, ToolExecutionResult, AgentStreamEvent } from '@/types/agent';

type Provider = 'openrouter' | 'groq' | 'cohere' | 'chutes' | 'fireworks' | 'cerebras' | 'huggingface' | 'gemini' | 'mistral' | 'deepseek' | 'openai' | 'anthropic' | 'zai';

const MAX_AGENT_ITERATIONS = 10;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface FileContent {
  path: string;
  content: string;
}

interface ParsedToolCall {
  name: ToolType;
  arguments: Record<string, unknown>;
  rawContent: string;
}

interface ParsedFileOperation {
  type: 'create' | 'update' | 'delete';
  path: string;
  content?: string;
}

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
    gemini: '', // handled separately
    anthropic: '', // handled separately
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

const TOOL_CALL_PATTERNS = {
  read_file: /<<<\s*TOOL_CALL\s*:\s*read_file\s*>>>([\s\S]*?)<<<\s*TOOL_END\s*>>>/gi,
  create_file: /<<<\s*FILE_CREATE\s*:\s*([^>]+?)>>>([\s\S]*?)<<<\s*FILE_END\s*>>>/gi,
  update_file: /<<<\s*FILE_UPDATE\s*:\s*([^>]+?)>>>([\s\S]*?)<<<\s*FILE_END\s*>>>/gi,
  delete_file: /<<<\s*FILE_DELETE\s*:\s*([^>]+?)>>>/gi,
};

function parseToolCalls(content: string): { toolCalls: ParsedToolCall[]; fileOperations: ParsedFileOperation[]; cleanContent: string } {
  const toolCalls: ParsedToolCall[] = [];
  const fileOperations: ParsedFileOperation[] = [];
  let cleanContent = content;

  // Parse read_file tool calls
  const readFileRegex = /<<<\s*TOOL_CALL\s*:\s*read_file\s*>>>([\s\S]*?)<<<\s*TOOL_END\s*>>>/gi;
  const readFileMatches = content.matchAll(readFileRegex);
  for (const match of readFileMatches) {
    try {
      const jsonContent = match[1].trim();
      const args = JSON.parse(jsonContent);
      toolCalls.push({
        name: 'read_file',
        arguments: args,
        rawContent: match[0],
      });
    } catch {
      const pathMatch = match[1].match(/["']?path["']?\s*:\s*["']([^"']+)["']/);
      if (pathMatch) {
        toolCalls.push({
          name: 'read_file',
          arguments: { path: pathMatch[1] },
          rawContent: match[0],
        });
      }
    }
    cleanContent = cleanContent.replace(match[0], '');
  }

  // Parse FILE_CREATE operations
  const createRegex = /<<<\s*FILE_CREATE\s*:\s*([^>]+?)>>>([\s\S]*?)<<<\s*FILE_END\s*>>>/gi;
  const createMatches = content.matchAll(createRegex);
  for (const match of createMatches) {
    const path = match[1].trim();
    const fileContent = cleanFileContent(match[2]);
    fileOperations.push({
      type: 'create',
      path,
      content: fileContent,
    });
    cleanContent = cleanContent.replace(match[0], `[Created: ${path}]`);
  }

  // Parse FILE_UPDATE operations
  const updateRegex = /<<<\s*FILE_UPDATE\s*:\s*([^>]+?)>>>([\s\S]*?)<<<\s*FILE_END\s*>>>/gi;
  const updateMatches = content.matchAll(updateRegex);
  for (const match of updateMatches) {
    const path = match[1].trim();
    const fileContent = cleanFileContent(match[2]);
    fileOperations.push({
      type: 'update',
      path,
      content: fileContent,
    });
    cleanContent = cleanContent.replace(match[0], `[Updated: ${path}]`);
  }

  // Parse FILE_DELETE operations
  const deleteRegex = /<<<\s*FILE_DELETE\s*:\s*([^>]+?)>>>/gi;
  const deleteMatches = content.matchAll(deleteRegex);
  for (const match of deleteMatches) {
    const path = match[1].trim();
    fileOperations.push({
      type: 'delete',
      path,
    });
    cleanContent = cleanContent.replace(match[0], `[Deleted: ${path}]`);
  }

  return { toolCalls, fileOperations, cleanContent: cleanContent.trim() };
}

function cleanFileContent(content: string): string {
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    if (firstNewline !== -1) {
      cleaned = cleaned.slice(firstNewline + 1);
    } else {
      cleaned = cleaned.slice(3);
    }
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.replace(/\n*```\s*$/, '');
  return cleaned.trim();
}

function executeReadFile(path: string, files: FileContent[]): ToolExecutionResult {
  const file = files.find(f => f.path === path);
  if (!file) {
    return {
      success: false,
      toolName: 'read_file',
      error: `File not found: ${path}`,
    };
  }
  return {
    success: true,
    toolName: 'read_file',
    data: {
      path: file.path,
      content: file.content,
      lineCount: file.content.split('\n').length,
      charCount: file.content.length,
    },
  };
}

async function streamLLMResponse(
  messages: Message[],
  model: string,
  apiKey: string,
  provider: Provider,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  if (provider === 'gemini') {
    return streamGeminiResponse(messages, model, apiKey, temperature, maxTokens);
  }
  if (provider === 'anthropic') {
    return streamAnthropicResponse(messages, model, apiKey, temperature, maxTokens);
  }
  if (provider === 'cohere') {
    return streamCohereResponse(messages, model, apiKey, temperature, maxTokens);
  }

  const response = await fetch(getApiEndpoint(provider), {
    method: 'POST',
    headers: getApiHeaders(provider, apiKey),
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 8192,
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
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function streamGeminiResponse(
  messages: Message[],
  model: string,
  apiKey: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  const systemMessage = messages.find(m => m.role === 'system');
  const geminiContents = messages
    .filter(m => m.role !== 'system')
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiContents,
        systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
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
      errorMessage = error.error?.message || 'API error';
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function streamAnthropicResponse(
  messages: Message[],
  model: string,
  apiKey: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
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
      max_tokens: maxTokens ?? 8192,
      system: systemMessage?.content,
      messages: anthropicMessages,
      temperature: temperature ?? 0.7,
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
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

async function streamCohereResponse(
  messages: Message[],
  model: string,
  apiKey: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
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
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 8192,
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
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.message?.content?.[0]?.text || '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages: initialMessages,
      model,
      apiKey,
      temperature,
      maxTokens,
      systemInstruction,
      fileContext,
      files = [],
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

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: AgentStreamEvent) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        };

        try {
          const systemPrompt = buildSystemPrompt(systemInstruction, fileContext);
          const conversationMessages: Message[] = [
            { role: 'system', content: systemPrompt },
            ...initialMessages,
          ];
          
          let currentFiles: FileContent[] = [...files];
          let iteration = 0;

          while (iteration < MAX_AGENT_ITERATIONS) {
            iteration++;
            sendEvent({ type: 'loop_iteration', iteration });

            // Make LLM call
            const llmResponse = await streamLLMResponse(
              conversationMessages,
              model,
              apiKey,
              provider,
              temperature ?? 0.7,
              maxTokens ?? 8192,
            );

            // Parse the response for tool calls and file operations
            const { toolCalls, fileOperations, cleanContent } = parseToolCalls(llmResponse);

            // Send the clean content as tokens
            if (cleanContent) {
              sendEvent({ type: 'token', content: cleanContent });
            }

            // Process file operations first (create/update/delete)
            for (const op of fileOperations) {
              sendEvent({
                type: 'file_operation',
                fileOperation: op,
              });

              // Update local file cache for subsequent reads
              if (op.type === 'create' || op.type === 'update') {
                const existingIndex = currentFiles.findIndex(f => f.path === op.path);
                if (existingIndex >= 0) {
                  currentFiles[existingIndex] = { path: op.path, content: op.content || '' };
                } else {
                  currentFiles.push({ path: op.path, content: op.content || '' });
                }
              } else if (op.type === 'delete') {
                currentFiles = currentFiles.filter(f => f.path !== op.path);
              }
            }

            // If there are tool calls, execute them and continue the loop
            if (toolCalls.length > 0) {
              const toolResults: string[] = [];

              for (const toolCall of toolCalls) {
                sendEvent({
                  type: 'tool_call',
                  toolCall: {
                    toolName: toolCall.name,
                    arguments: toolCall.arguments,
                  },
                });

                // Execute the tool
                let result: ToolExecutionResult;
                if (toolCall.name === 'read_file') {
                  const path = (toolCall.arguments as { path?: string })?.path || '';
                  result = executeReadFile(path, currentFiles);
                } else {
                  result = {
                    success: false,
                    toolName: toolCall.name,
                    error: `Unknown tool: ${toolCall.name}`,
                  };
                }

                sendEvent({
                  type: 'tool_result',
                  toolResult: result,
                });

                // Format tool result for the next LLM call
                if (result.success && result.data) {
                  const fileData = result.data as { path: string; content: string };
                  toolResults.push(
                    `[Tool Result: read_file]\nFile: ${fileData.path}\nContent:\n\`\`\`\n${fileData.content}\n\`\`\``
                  );
                } else {
                  toolResults.push(
                    `[Tool Result: ${toolCall.name}]\nError: ${result.error}`
                  );
                }
              }

              // Add assistant's response and tool results to conversation
              conversationMessages.push({
                role: 'assistant',
                content: llmResponse,
              });

              // Add tool results as a user message for the next iteration
              conversationMessages.push({
                role: 'user',
                content: `Tool execution completed. Results:\n\n${toolResults.join('\n\n')}\n\nPlease continue with your response based on the tool results above.`,
              });

              // Continue the loop for another LLM call
              continue;
            }

            // No more tool calls - we're done
            // Add the final response to the conversation
            conversationMessages.push({
              role: 'assistant',
              content: llmResponse,
            });

            sendEvent({ type: 'done' });
            break;
          }

          if (iteration >= MAX_AGENT_ITERATIONS) {
            sendEvent({
              type: 'error',
              message: 'Maximum agent iterations reached. Please try a simpler request.',
            });
          }

          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Connection error';
          sendEvent({ type: 'error', message });
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
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
