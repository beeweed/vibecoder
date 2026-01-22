'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Square,
  Loader2,
  Bot,
  User,
  FileCode,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/stores/chatStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAgentStore } from '@/stores/agentStore';
import { useFileSystemStore } from '@/stores/fileSystemStore';
import type { VirtualFile } from '@/types/files';
import { useEditorStore } from '@/stores/editorStore';
import {
  createParser,
  parseChunk,
  flushParser,
  type ParsedFileOperation,
} from '@/lib/parser';
import { buildFileTreeContext } from '@/lib/systemPrompt';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const statusConfig = {
  idle: { icon: Sparkles, label: 'Ready', color: 'text-[#9a9a9c]' },
  thinking: { icon: Brain, label: 'Planning...', color: 'text-purple-400' },
  writing: { icon: Pencil, label: 'Writing code...', color: 'text-[#dcdcde]' },
  refactoring: { icon: FileCode, label: 'Refactoring...', color: 'text-[#dcdcde]' },
  completed: { icon: CheckCircle2, label: 'Completed', color: 'text-[#dcdcde]' },
  error: { icon: AlertCircle, label: 'Error', color: 'text-red-400' },
};

export function AIPanel() {
  const [input, setInput] = useState('');
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = useChatStore((s) => s.messages);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const isThinking = useChatStore((s) => s.isThinking);
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const startAssistantMessage = useChatStore((s) => s.startAssistantMessage);
  const appendToMessage = useChatStore((s) => s.appendToMessage);
  const finalizeMessage = useChatStore((s) => s.finalizeMessage);
  const setGenerating = useChatStore((s) => s.setGenerating);
  const setThinking = useChatStore((s) => s.setThinking);
  const setError = useChatStore((s) => s.setError);
  const cancelGeneration = useChatStore((s) => s.cancelGeneration);
  const getMessagesForAPI = useChatStore((s) => s.getMessagesForAPI);
  const setMessageThinking = useChatStore((s) => s.setMessageThinking);
  const finalizeThinking = useChatStore((s) => s.finalizeThinking);

  const provider = useSettingsStore((s) => s.provider);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const groqApiKey = useSettingsStore((s) => s.groqApiKey);
  const cohereApiKey = useSettingsStore((s) => s.cohereApiKey);
  const chutesApiKey = useSettingsStore((s) => s.chutesApiKey);
  const fireworksApiKey = useSettingsStore((s) => s.fireworksApiKey);
  const cerebrasApiKey = useSettingsStore((s) => s.cerebrasApiKey);
  const huggingfaceApiKey = useSettingsStore((s) => s.huggingfaceApiKey);
  const geminiApiKey = useSettingsStore((s) => s.geminiApiKey);
  const mistralApiKey = useSettingsStore((s) => s.mistralApiKey);
  const deepseekApiKey = useSettingsStore((s) => s.deepseekApiKey);
  const openaiApiKey = useSettingsStore((s) => s.openaiApiKey);
  const anthropicApiKey = useSettingsStore((s) => s.anthropicApiKey);
  const zaiApiKey = useSettingsStore((s) => s.zaiApiKey);
  const selectedModel = useSettingsStore((s) => s.selectedModel);
  const temperature = useSettingsStore((s) => s.temperature);
  const maxTokens = useSettingsStore((s) => s.maxTokens);
  const systemInstruction = useSettingsStore((s) => s.systemInstruction);
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);

  const getActiveApiKey = (): string | null => {
    if (provider === 'groq') return groqApiKey;
    if (provider === 'cohere') return cohereApiKey;
    if (provider === 'chutes') return chutesApiKey;
    if (provider === 'fireworks') return fireworksApiKey;
    if (provider === 'cerebras') return cerebrasApiKey;
    if (provider === 'huggingface') return huggingfaceApiKey;
    if (provider === 'gemini') return geminiApiKey;
    if (provider === 'mistral') return mistralApiKey;
    if (provider === 'deepseek') return deepseekApiKey;
    if (provider === 'openai') return openaiApiKey;
    if (provider === 'anthropic') return anthropicApiKey;
    if (provider === 'zai') return zaiApiKey;
    return apiKey;
  };
  
  const activeApiKey = getActiveApiKey();

  const status = useAgentStore((s) => s.status);
  const currentFile = useAgentStore((s) => s.currentFile);
  const activityLog = useAgentStore((s) => s.activityLog);
  const setStatus = useAgentStore((s) => s.setStatus);
  const setCurrentFile = useAgentStore((s) => s.setCurrentFile);
  const addActivityLog = useAgentStore((s) => s.addActivityLog);
  const agentSetError = useAgentStore((s) => s.setError);

  const createFile = useFileSystemStore((s) => s.createFile);
  const updateFile = useFileSystemStore((s) => s.updateFile);
  const deleteFile = useFileSystemStore((s) => s.deleteFile);
  const nodes = useFileSystemStore((s) => s.nodes);
  const clearLastOperations = useFileSystemStore((s) => s.clearLastOperations);

  const openFile = useEditorStore((s) => s.openFile);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const executeFileOperation = useCallback(
    (operation: ParsedFileOperation) => {
      const fileName = operation.path.split('/').pop() || operation.path;

      switch (operation.type) {
        case 'create':
          createFile(operation.path, operation.content || '');
          addActivityLog('created', operation.path);
          openFile(operation.path, fileName);
          break;
        case 'update':
          updateFile(operation.path, operation.content || '');
          addActivityLog('updated', operation.path);
          break;
        case 'delete':
          deleteFile(operation.path);
          addActivityLog('deleted', operation.path);
          break;
      }
    },
    [createFile, updateFile, deleteFile, addActivityLog, openFile]
  );

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return;

    if (!activeApiKey) {
      const providerNames: Record<string, string> = {
        groq: 'Groq',
        cohere: 'Cohere',
        chutes: 'Chutes',
        fireworks: 'Fireworks',
        cerebras: 'Cerebras',
        huggingface: 'Hugging Face',
        gemini: 'Gemini',
        mistral: 'Mistral',
        deepseek: 'DeepSeek',
        openai: 'OpenAI',
        anthropic: 'Anthropic',
        zai: 'Z.ai',
        openrouter: 'OpenRouter',
      };
      const providerName = providerNames[provider] || 'OpenRouter';
      toast.error(`Please add your ${providerName} API key in settings`);
      setSettingsOpen(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    const userMessageId = addUserMessage(userMessage);
    clearLastOperations();

    const abortController = new AbortController();
    setGenerating(true, abortController);
    setThinking(true);
    setStatus('thinking');

    // Expand the thinking section for the current message
    setExpandedThinking(prev => ({ ...prev, [userMessageId]: true }));

    try {
      const files = Object.values(nodes).filter((n) => n.type === 'file') as VirtualFile[];
      const fileContext = buildFileTreeContext(
        files.map((f) => ({ path: f.path, content: f.content }))
      );

      // ==========================================
      // PHASE 1: Thinking / Planning
      // ==========================================
      setMessageThinking(userMessageId, { plan: [], isStreaming: true });

      const thinkResponse = await fetch('/api/think', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          model: selectedModel,
          apiKey: activeApiKey,
          provider,
          fileContext,
        }),
        signal: abortController.signal,
      });

      if (!thinkResponse.ok) {
        const error = await thinkResponse.json();
        throw new Error(error.error || 'Failed to get thinking response');
      }

      const thinkData = await thinkResponse.json();
      const plan: string[] = thinkData.plan || [];

      // Update the user message with the thinking plan
      setMessageThinking(userMessageId, { plan, isStreaming: false });
      finalizeThinking(userMessageId);
      setThinking(false);

      // ==========================================
      // PHASE 2: Coding / Execution
      // ==========================================
      setStatus('writing');

      const messageId = startAssistantMessage();
      let parserState = createParser();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...getMessagesForAPI().slice(0, -1), { role: 'user', content: userMessage }],
          model: selectedModel,
          apiKey: activeApiKey,
          provider,
          temperature,
          maxTokens,
          systemInstruction,
          fileContext,
          thinkingPlan: plan,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect to API');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
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

          try {
            const data = JSON.parse(trimmedLine.slice(6));

            if (data.type === 'token' && data.content) {
              const result = parseChunk(parserState, data.content);
              parserState = result.state;

              if (result.displayText) {
                appendToMessage(messageId, result.displayText);
              }

              if (result.currentFilePath) {
                setStatus('writing');
                setCurrentFile(result.currentFilePath);
              }

              for (const op of result.newOperations) {
                executeFileOperation(op);
              }
            } else if (data.type === 'error') {
              throw new Error(data.message);
            } else if (data.type === 'done') {
              const flushResult = flushParser(parserState);
              if (flushResult.displayText) {
                appendToMessage(messageId, flushResult.displayText);
              }
              if (flushResult.incompleteOperation) {
                executeFileOperation(flushResult.incompleteOperation);
              }
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      finalizeMessage(messageId);
      setStatus('completed');
      setCurrentFile(null);

      setTimeout(() => {
        if (useAgentStore.getState().status === 'completed') {
          setStatus('idle');
        }
      }, 2000);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        setThinking(false);
        setStatus('idle');
        return;
      }

      const message = error instanceof Error ? error.message : 'An error occurred';
      setError(message);
      agentSetError(message);
      toast.error(message);
      setThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="h-full flex flex-col bg-[#161618]">
      <div className="px-4 py-3 border-b border-[#272729]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#9a9a9c] uppercase tracking-wider">
            AI Agent
          </span>
          <Badge
            variant="outline"
            className={cn(
              'text-xs border-[#3a3a3c]',
              statusConfig[status].color
            )}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig[status].label}
          </Badge>
        </div>

        <AnimatePresence>
          {currentFile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-sm text-[#dcdcde]"
            >
              <FileCode className="w-4 h-4" />
              <span className="truncate">{currentFile}</span>
              <Loader2 className="w-3 h-3 animate-spin ml-auto" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activityLog.length > 0 && (
        <div className="px-4 py-2 border-b border-[#272729] max-h-24 overflow-y-auto">
          <span className="text-xs text-[#7a7a7c] mb-1 block">Recent Activity</span>
          {activityLog.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="text-xs flex items-center gap-2 py-0.5 text-[#9a9a9c]"
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  log.action === 'created' && 'bg-[#dcdcde]',
                  log.action === 'updated' && 'bg-[#9a9a9c]',
                  log.action === 'deleted' && 'bg-red-400'
                )}
              />
              <span className="capitalize">{log.action}</span>
              <span className="truncate text-[#7a7a7c]">{log.filePath}</span>
            </div>
          ))}
        </div>
      )}

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-4 pr-1">
          {messages.length === 0 && (
            <div className="text-center py-12 text-[#7a7a7c]">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Start coding with AI</p>
              <p className="text-sm mt-1">
                Describe what you want to build and I&apos;ll write the code
              </p>
            </div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {message.role === 'user' ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 flex-row-reverse">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-[#272729] text-[#dcdcde]">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="rounded-lg px-3 py-2 bg-[#272729] text-[#dcdcde] text-sm" style={{ wordBreak: 'break-word' }}>
                      {message.content}
                    </div>
                  </div>
                  
                  {/* Thinking Section - Below User Message */}
                  {message.thinking && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="ml-0 mr-9"
                    >
                      <div className="bg-[#1e1e20] border border-[#3a3a3c] rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedThinking(prev => ({
                            ...prev,
                            [message.id]: !prev[message.id]
                          }))}
                          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[#272729] transition-colors"
                        >
                          {expandedThinking[message.id] ? (
                            <ChevronDown className="w-4 h-4 text-purple-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-purple-400" />
                          )}
                          <Brain className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-medium text-purple-400">
                            Thinking Plan
                          </span>
                          {message.thinking.isStreaming && (
                            <Loader2 className="w-3 h-3 animate-spin text-purple-400 ml-auto" />
                          )}
                          {!message.thinking.isStreaming && message.thinking.plan.length > 0 && (
                            <span className="text-xs text-[#7a7a7c] ml-auto">
                              {message.thinking.plan.length} steps
                            </span>
                          )}
                        </button>
                        
                        <AnimatePresence>
                          {expandedThinking[message.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 pt-1 border-t border-[#3a3a3c]">
                                {message.thinking.isStreaming && message.thinking.plan.length === 0 ? (
                                  <div className="flex items-center gap-2 text-xs text-[#7a7a7c]">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Analyzing your request...
                                  </div>
                                ) : (
                                  <ol className="space-y-1.5 mt-1">
                                    {message.thinking.plan.map((step, index) => (
                                      <motion.li
                                        key={`${message.id}-step-${index}-${step.slice(0, 20)}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-start gap-2 text-xs"
                                      >
                                        <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 text-[10px] font-medium mt-0.5">
                                          {index + 1}
                                        </span>
                                        <span className="text-[#b0b0b2]">{step}</span>
                                      </motion.li>
                                    ))}
                                  </ol>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="text-[#b0b0b2] text-sm leading-relaxed" style={{ wordBreak: 'break-word' }}>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-4 mb-3 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-4 mb-3 space-y-1">{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                      code: ({ children }) => (
                        <code className="bg-[#272729] px-1.5 py-0.5 rounded text-xs font-mono text-[#dcdcde]">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-[#272729] p-3 rounded text-xs overflow-x-auto my-3">
                          {children}
                        </pre>
                      ),
                      strong: ({ children }) => <strong className="font-semibold text-[#dcdcde]">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-4 text-[#dcdcde]">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold mb-2 mt-3 text-[#dcdcde]">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 text-[#dcdcde]">{children}</h3>,
                    }}
                  >
                    {message.content || (message.isStreaming ? '...' : '')}
                  </ReactMarkdown>
                  {message.isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#dcdcde] animate-pulse align-middle" />
                  )}
                </div>
              )}
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-[#272729]">
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeApiKey
                ? 'Describe what you want to build...'
                : 'Add API key in settings to start...'
            }
            disabled={!activeApiKey || isGenerating}
            rows={3}
            className="pr-12 resize-none bg-[#272729] border-[#3a3a3c] focus:border-[#dcdcde] text-[#dcdcde] placeholder:text-[#7a7a7c]"
          />
          <Button
            size="icon"
            className={cn(
              'absolute right-2 bottom-2',
              isGenerating
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-[#dcdcde] hover:bg-[#c0c0c2] text-[#161618]'
            )}
            onClick={isGenerating ? cancelGeneration : handleSubmit}
            disabled={!activeApiKey || (!isGenerating && !input.trim())}
          >
            {isGenerating ? (
              <Square className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-[#7a7a7c] mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
