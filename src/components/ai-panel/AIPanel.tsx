'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  idle: { icon: Sparkles, label: 'Ready', color: 'text-zinc-400' },
  thinking: { icon: Brain, label: 'Thinking...', color: 'text-yellow-400' },
  writing: { icon: Pencil, label: 'Writing code...', color: 'text-green-400' },
  refactoring: { icon: FileCode, label: 'Refactoring...', color: 'text-blue-400' },
  completed: { icon: CheckCircle2, label: 'Completed', color: 'text-violet-400' },
  error: { icon: AlertCircle, label: 'Error', color: 'text-red-400' },
};

export function AIPanel() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = useChatStore((s) => s.messages);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const startAssistantMessage = useChatStore((s) => s.startAssistantMessage);
  const appendToMessage = useChatStore((s) => s.appendToMessage);
  const finalizeMessage = useChatStore((s) => s.finalizeMessage);
  const setGenerating = useChatStore((s) => s.setGenerating);
  const setError = useChatStore((s) => s.setError);
  const cancelGeneration = useChatStore((s) => s.cancelGeneration);
  const getMessagesForAPI = useChatStore((s) => s.getMessagesForAPI);

  const apiKey = useSettingsStore((s) => s.apiKey);
  const selectedModel = useSettingsStore((s) => s.selectedModel);
  const temperature = useSettingsStore((s) => s.temperature);
  const maxTokens = useSettingsStore((s) => s.maxTokens);
  const systemInstruction = useSettingsStore((s) => s.systemInstruction);
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);

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

    if (!apiKey) {
      toast.error('Please add your OpenRouter API key in settings');
      setSettingsOpen(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    addUserMessage(userMessage);
    clearLastOperations();

    const abortController = new AbortController();
    setGenerating(true, abortController);
    setStatus('thinking');

    const messageId = startAssistantMessage();
    let parserState = createParser();

    try {
      const files = Object.values(nodes).filter((n) => n.type === 'file') as VirtualFile[];
      const fileContext = buildFileTreeContext(
        files.map((f) => ({ path: f.path, content: f.content }))
      );

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...getMessagesForAPI().slice(0, -1), { role: 'user', content: userMessage }],
          model: selectedModel,
          apiKey,
          temperature,
          maxTokens,
          systemInstruction,
          fileContext,
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
        finalizeMessage(messageId);
        setStatus('idle');
        return;
      }

      const message = error instanceof Error ? error.message : 'An error occurred';
      setError(message);
      agentSetError(message);
      toast.error(message);
      finalizeMessage(messageId);
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
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            AI Agent
          </span>
          <Badge
            variant="outline"
            className={cn(
              'text-xs border-zinc-700',
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
              className="flex items-center gap-2 text-sm text-green-400"
            >
              <FileCode className="w-4 h-4" />
              <span className="truncate">{currentFile}</span>
              <Loader2 className="w-3 h-3 animate-spin ml-auto" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activityLog.length > 0 && (
        <div className="px-4 py-2 border-b border-zinc-800 max-h-24 overflow-y-auto">
          <span className="text-xs text-zinc-500 mb-1 block">Recent Activity</span>
          {activityLog.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="text-xs flex items-center gap-2 py-0.5 text-zinc-400"
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  log.action === 'created' && 'bg-green-400',
                  log.action === 'updated' && 'bg-yellow-400',
                  log.action === 'deleted' && 'bg-red-400'
                )}
              />
              <span className="capitalize">{log.action}</span>
              <span className="truncate text-zinc-500">{log.filePath}</span>
            </div>
          ))}
        </div>
      )}

      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
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
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  message.role === 'user'
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'bg-zinc-800 text-zinc-400'
                )}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={cn(
                  'flex-1 rounded-lg px-4 py-3',
                  message.role === 'user'
                    ? 'bg-violet-500/20 text-zinc-100'
                    : 'bg-zinc-900 text-zinc-300'
                )}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>
                      {message.content || (message.isStreaming ? '...' : '')}
                    </ReactMarkdown>
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-violet-400 animate-pulse" />
                    )}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-zinc-800">
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              apiKey
                ? 'Describe what you want to build...'
                : 'Add API key in settings to start...'
            }
            disabled={!apiKey || isGenerating}
            rows={3}
            className="pr-12 resize-none bg-zinc-900 border-zinc-700 focus:border-violet-500"
          />
          <Button
            size="icon"
            className={cn(
              'absolute right-2 bottom-2',
              isGenerating
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-violet-500 hover:bg-violet-600'
            )}
            onClick={isGenerating ? cancelGeneration : handleSubmit}
            disabled={!apiKey || (!isGenerating && !input.trim())}
          >
            {isGenerating ? (
              <Square className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
