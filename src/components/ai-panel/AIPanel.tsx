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
  Play,
  Trash2,
  SkipForward,
  FileSearch,
  RefreshCw,
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
import type { FileOperation, ToolCallState } from '@/types/chat';
import type { AgentStreamEvent, ToolExecutionResult } from '@/types/agent';
import { useEditorStore } from '@/stores/editorStore';
import {
  createParser,
  parseChunk,
  flushParser,
  type ParsedFileOperation,
  type ParsedToolCall,
} from '@/lib/parser';
import { buildFileTreeContext, buildFileTreeSummary } from '@/lib/systemPrompt';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { ToolCallsList, ActiveToolCallBanner } from './ToolCallIndicator';

function FileOperationsInline({ 
  operations, 
  isStreaming 
}: { 
  operations: FileOperation[]; 
  isStreaming?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const openFile = useEditorStore((s) => s.openFile);
  
  const displayedOps = showAll ? operations : operations.slice(-1);
  const hasMore = operations.length > 1;
  
  const getActionConfig = (action: string) => {
    switch (action) {
      case 'created': 
        return { 
          label: 'Created', 
          icon: FileCode, 
          bgColor: 'bg-[#272729]',
          textColor: 'text-[#9a9a9c]',
          fileColor: 'text-[#dcdcde]',
          hoverBg: 'hover:bg-[#3a3a3c]'
        };
      case 'updated': 
        return { 
          label: 'Editing', 
          icon: FileCode, 
          bgColor: 'bg-[#272729]',
          textColor: 'text-[#9a9a9c]',
          fileColor: 'text-[#dcdcde]',
          hoverBg: 'hover:bg-[#3a3a3c]'
        };
      case 'deleted': 
        return { 
          label: 'Deleted', 
          icon: Trash2, 
          bgColor: 'bg-red-950/50',
          textColor: 'text-red-400',
          fileColor: 'text-red-300',
          hoverBg: 'hover:bg-red-950/70'
        };
      case 'skipped': 
        return { 
          label: 'Skipped', 
          icon: SkipForward, 
          bgColor: 'bg-amber-950/50',
          textColor: 'text-amber-400',
          fileColor: 'text-amber-300',
          hoverBg: 'hover:bg-amber-950/70'
        };
      default: 
        return { 
          label: action, 
          icon: FileCode, 
          bgColor: 'bg-[#272729]',
          textColor: 'text-[#9a9a9c]',
          fileColor: 'text-[#dcdcde]',
          hoverBg: 'hover:bg-[#3a3a3c]'
        };
    }
  };

  const handleFileClick = (op: FileOperation) => {
    // Don't open deleted or skipped files
    if (op.action === 'deleted' || op.action === 'skipped') return;
    openFile(op.filePath, op.fileName);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 pt-1"
    >
      {displayedOps.map((op) => {
        const config = getActionConfig(op.action);
        const IconComponent = config.icon;
        const isClickable = op.action !== 'deleted' && op.action !== 'skipped';
        
        return (
          <button
            key={op.id}
            type="button"
            onClick={() => handleFileClick(op)}
            disabled={!isClickable}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors text-xs group",
              config.bgColor,
              isClickable ? config.hoverBg : 'cursor-default',
            )}
            title={op.reason || undefined}
          >
            <IconComponent className={cn("w-3.5 h-3.5", config.textColor)} />
            <span className={config.textColor}>{config.label}</span>
            <span className={cn(isClickable && "group-hover:underline", config.fileColor)}>
              {op.fileName}
            </span>
            {op.reason && (
              <span className="text-amber-400/70 text-[10px]">({op.reason})</span>
            )}
            {isStreaming && op === operations[operations.length - 1] && (
              <Loader2 className="w-3 h-3 animate-spin text-[#9a9a9c]" />
            )}
          </button>
        );
      })}
      
      {hasMore && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="px-2 py-1 rounded-md border border-[#3a3a3c] hover:bg-[#272729] transition-colors text-xs text-[#9a9a9c]"
        >
          Show all ({operations.length})
        </button>
      )}
      
      {showAll && hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="px-2 py-1 rounded-md border border-[#3a3a3c] hover:bg-[#272729] transition-colors text-xs text-[#9a9a9c]"
        >
          Show less
        </button>
      )}
    </motion.div>
  );
}

const statusConfig = {
  idle: { icon: Sparkles, label: 'Ready', color: 'text-[#9a9a9c]' },
  thinking: { icon: Brain, label: 'Thinking...', color: 'text-purple-400' },
  reading: { icon: FileSearch, label: 'Reading file...', color: 'text-blue-400' },
  writing: { icon: Pencil, label: 'Writing code...', color: 'text-[#dcdcde]' },
  refactoring: { icon: FileCode, label: 'Refactoring...', color: 'text-[#dcdcde]' },
  executing_tool: { icon: RefreshCw, label: 'Executing tool...', color: 'text-amber-400' },
  completed: { icon: CheckCircle2, label: 'Completed', color: 'text-[#dcdcde]' },
  error: { icon: AlertCircle, label: 'Error', color: 'text-red-400' },
};

export function AIPanel() {
  const [input, setInput] = useState('');
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentAssistantMessageIdRef = useRef<string | null>(null);

  const messages = useChatStore((s) => s.messages);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const isThinking = useChatStore((s) => s.isThinking);
  const lastCancelledMessageId = useChatStore((s) => s.lastCancelledMessageId);
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
  const markMessageCancelled = useChatStore((s) => s.markMessageCancelled);
  const clearCancelled = useChatStore((s) => s.clearCancelled);
  const addFileOperation = useChatStore((s) => s.addFileOperation);

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

  const addToolCall = useChatStore((s) => s.addToolCall);
  const updateToolCallStatus = useChatStore((s) => s.updateToolCallStatus);
  const setExecutingTool = useChatStore((s) => s.setExecutingTool);
  const isExecutingTool = useChatStore((s) => s.isExecutingTool);
  const activeToolCallId = useChatStore((s) => s.activeToolCallId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message changes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getFileByPath = useFileSystemStore((s) => s.getFileByPath);

  const readFileContent = useCallback(
    (path: string): string => {
      const file = getFileByPath(path);
      if (file) {
        return file.content;
      }
      return `[File not found: ${path}]`;
    },
    [getFileByPath]
  );

  const executeToolCall = useCallback(
    async (toolCall: ParsedToolCall, messageId: string): Promise<string | null> => {
      if (toolCall.name === 'read_file') {
        const path = (toolCall.arguments as { path?: string })?.path;
        if (!path) {
          return null; // Error will be shown in the tool call UI
        }

        // Add tool call to message immediately (shows loading state)
        const toolCallId = addToolCall(messageId, 'read_file', toolCall.arguments);
        setExecutingTool(true, toolCallId);
        setStatus('reading');
        addActivityLog('read', path);

        // Update status to executing
        updateToolCallStatus(messageId, toolCallId, 'executing');

        try {
          // Get file content from virtual file system
          const file = getFileByPath(path);
          
          if (!file) {
            updateToolCallStatus(messageId, toolCallId, 'error', {
              success: false,
              error: `File not found: ${path}`,
            });
            setExecutingTool(false, null);
            return null; // Error shown in UI, no text to append
          }

          // Call API for validation and processing
          const response = await fetch('/api/tools/read-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path,
              fileContent: file.content,
            }),
          });

          const result = await response.json();

          if (!result.success) {
            updateToolCallStatus(messageId, toolCallId, 'error', {
              success: false,
              error: result.error,
            });
            setExecutingTool(false, null);
            return null; // Error shown in UI
          }

          // Success - store file content in tool call result (displayed in dropdown)
          updateToolCallStatus(messageId, toolCallId, 'completed', {
            success: true,
            data: result.data,
          });
          setExecutingTool(false, null);

          // Return null - content is shown in the collapsible dropdown, not in message text
          return null;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          updateToolCallStatus(messageId, toolCallId, 'error', {
            success: false,
            error: errorMsg,
          });
          setExecutingTool(false, null);
          return null; // Error shown in UI
        }
      }

      return null;
    },
    [getFileByPath, addToolCall, updateToolCallStatus, setExecutingTool, setStatus, addActivityLog]
  );

  const executeFileOperation = useCallback(
    (operation: ParsedFileOperation, messageId?: string): string | null => {
      const fileName = operation.path.split('/').pop() || operation.path;

      switch (operation.type) {
        case 'create':
          createFile(operation.path, operation.content || '');
          addActivityLog('created', operation.path);
          if (messageId) addFileOperation(messageId, 'created', operation.path);
          openFile(operation.path, fileName);
          return null;
        case 'update':
          updateFile(operation.path, operation.content || '');
          addActivityLog('updated', operation.path);
          if (messageId) addFileOperation(messageId, 'updated', operation.path);
          return null;
        case 'delete': {
          // Check if file exists before deleting
          const existingFile = getFileByPath(operation.path);
          if (existingFile) {
            deleteFile(operation.path);
            addActivityLog('deleted', operation.path);
            if (messageId) addFileOperation(messageId, 'deleted', operation.path);
            toast.success(`Deleted: ${fileName}`);
          } else {
            // File doesn't exist - show skipped
            addActivityLog('skipped', operation.path);
            if (messageId) addFileOperation(messageId, 'skipped', operation.path, 'File not found');
            toast.warning(`Skipped: ${fileName} (file not found)`);
          }
          return null;
        }
        case 'read': {
          const content = readFileContent(operation.path);
          return content;
        }
        default:
          return null;
      }
    },
    [createFile, updateFile, deleteFile, getFileByPath, addActivityLog, addFileOperation, openFile, readFileContent]
  );

  const processFileOperations = useCallback(
    (operations: ParsedFileOperation[], messageId: string) => {
      for (const op of operations) {
        const result = executeFileOperation(op, messageId);
        if (op.type === 'read' && result) {
          const fileName = op.path.split('/').pop() || op.path;
          appendToMessage(messageId, `\n\n📖 **Reading ${fileName}:**\n\`\`\`\n${result}\n\`\`\`\n\n`);
        }
      }
    },
    [executeFileOperation, appendToMessage]
  );

  const processToolCalls = useCallback(
    async (toolCalls: ParsedToolCall[], messageId: string): Promise<void> => {
      for (const toolCall of toolCalls) {
        await executeToolCall(toolCall, messageId);
        // Results are displayed in the ToolCallIndicator dropdown, not in message text
      }
    },
    [executeToolCall]
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

    setExpandedThinking(prev => ({ ...prev, [userMessageId]: true }));

    try {
      const files = Object.values(nodes).filter((n) => n.type === 'file') as VirtualFile[];
      const fileContext = buildFileTreeContext(
        files.map((f) => ({ path: f.path, content: f.content }))
      );
      const filesArray = files.map((f) => ({ path: f.path, content: f.content }));

      // ==========================================
      // PHASE 1: Thinking / Reasoning (Streaming)
      // ==========================================
      setMessageThinking(userMessageId, { reasoning: '', isStreaming: true });

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

      // Stream the thinking response
      const thinkReader = thinkResponse.body?.getReader();
      const thinkDecoder = new TextDecoder();

      if (!thinkReader) {
        throw new Error('No response body for thinking');
      }

      let thinkBuffer = '';
      let fullReasoning = '';

      while (true) {
        const { done, value } = await thinkReader.read();
        if (done) break;

        thinkBuffer += thinkDecoder.decode(value, { stream: true });
        const lines = thinkBuffer.split('\n');
        thinkBuffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(trimmedLine.slice(6));

            if (data.type === 'token' && data.content) {
              fullReasoning += data.content;
              setMessageThinking(userMessageId, { reasoning: fullReasoning, isStreaming: true });
            } else if (data.type === 'error') {
              throw new Error(data.message);
            } else if (data.type === 'done') {
              // Thinking complete
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      // Finalize thinking
      setMessageThinking(userMessageId, { reasoning: fullReasoning, isStreaming: false });
      finalizeThinking(userMessageId);
      setThinking(false);

      // ==========================================
      // PHASE 2: Agent Loop with Tool Execution
      // ==========================================
      setStatus('writing');

      const messageId = startAssistantMessage();
      currentAssistantMessageIdRef.current = messageId;

      // Use new agent endpoint with agentic loop
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          model: selectedModel,
          apiKey: activeApiKey,
          provider,
          temperature,
          maxTokens,
          systemInstruction,
          fileContext,
          files: filesArray,
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
            const data = JSON.parse(trimmedLine.slice(6)) as AgentStreamEvent;

            switch (data.type) {
              case 'token':
                if (data.content) {
                  appendToMessage(messageId, data.content);
                }
                break;

              case 'loop_iteration':
                if (data.iteration && data.iteration > 1) {
                  setStatus('executing_tool');
                  appendToMessage(messageId, `\n\n---\n*Agent iteration ${data.iteration}*\n\n`);
                }
                break;

              case 'tool_call':
                if (data.toolCall) {
                  setStatus('executing_tool');
                  const toolName = data.toolCall.toolName;
                  const args = data.toolCall.arguments as { path?: string };
                  addActivityLog('read', args.path || 'unknown');
                  
                  // Add tool call to the message
                  const toolCallId = addToolCall(messageId, toolName, data.toolCall.arguments);
                  updateToolCallStatus(messageId, toolCallId, 'executing');
                }
                break;

              case 'tool_result':
                if (data.toolResult) {
                  const result = data.toolResult as ToolExecutionResult;
                  setStatus('writing');
                  
                  // Find the last tool call and update its status
                  const message = useChatStore.getState().messages.find(m => m.id === messageId);
                  if (message?.toolCalls && message.toolCalls.length > 0) {
                    const lastToolCall = message.toolCalls[message.toolCalls.length - 1];
                    updateToolCallStatus(
                      messageId, 
                      lastToolCall.id, 
                      result.success ? 'completed' : 'error',
                      {
                        success: result.success,
                        data: result.data,
                        error: result.error,
                      }
                    );
                  }
                }
                break;

              case 'file_operation':
                if (data.fileOperation) {
                  const op = data.fileOperation;
                  const fileName = op.path.split('/').pop() || op.path;
                  
                  if (op.type === 'create') {
                    createFile(op.path, op.content || '');
                    addActivityLog('created', op.path);
                    addFileOperation(messageId, 'created', op.path);
                    openFile(op.path, fileName);
                    setCurrentFile(op.path);
                  } else if (op.type === 'update') {
                    updateFile(op.path, op.content || '');
                    addActivityLog('updated', op.path);
                    addFileOperation(messageId, 'updated', op.path);
                    setCurrentFile(op.path);
                  } else if (op.type === 'delete') {
                    const existingFile = getFileByPath(op.path);
                    if (existingFile) {
                      deleteFile(op.path);
                      addActivityLog('deleted', op.path);
                      addFileOperation(messageId, 'deleted', op.path);
                      toast.success(`Deleted: ${fileName}`);
                    } else {
                      addActivityLog('skipped', op.path);
                      addFileOperation(messageId, 'skipped', op.path, 'File not found');
                      toast.warning(`Skipped: ${fileName} (file not found)`);
                    }
                  }
                }
                break;

              case 'error':
                throw new Error(data.message || 'Unknown error');

              case 'done':
                // Agent loop complete
                break;
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      finalizeMessage(messageId);
      currentAssistantMessageIdRef.current = null;
      setStatus('completed');
      setCurrentFile(null);

      setTimeout(() => {
        if (useAgentStore.getState().status === 'completed') {
          setStatus('idle');
        }
      }, 2000);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        if (currentAssistantMessageIdRef.current) {
          markMessageCancelled(currentAssistantMessageIdRef.current);
        }
        setThinking(false);
        setStatus('idle');
        currentAssistantMessageIdRef.current = null;
        return;
      }

      const message = error instanceof Error ? error.message : 'An error occurred';
      setError(message);
      agentSetError(message);
      toast.error(message);
      setThinking(false);
      currentAssistantMessageIdRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleContinue = async () => {
    if (isGenerating || !activeApiKey) return;

    clearCancelled();

    const abortController = new AbortController();
    setGenerating(true, abortController);
    setStatus('writing');

    try {
      const files = Object.values(nodes).filter((n) => n.type === 'file') as VirtualFile[];
      const fileContext = buildFileTreeContext(
        files.map((f) => ({ path: f.path, content: f.content }))
      );
      const filesArray = files.map((f) => ({ path: f.path, content: f.content }));

      const messageId = startAssistantMessage();
      currentAssistantMessageIdRef.current = messageId;

      const continueMessages = [
        ...getMessagesForAPI(),
        { role: 'user', content: 'Continue from where you left off. Complete the remaining code and files.' }
      ];

      // Use new agent endpoint
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: continueMessages,
          model: selectedModel,
          apiKey: activeApiKey,
          provider,
          temperature,
          maxTokens,
          systemInstruction,
          fileContext,
          files: filesArray,
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
            const data = JSON.parse(trimmedLine.slice(6)) as AgentStreamEvent;

            switch (data.type) {
              case 'token':
                if (data.content) {
                  appendToMessage(messageId, data.content);
                }
                break;

              case 'loop_iteration':
                if (data.iteration && data.iteration > 1) {
                  setStatus('executing_tool');
                  appendToMessage(messageId, `\n\n---\n*Agent iteration ${data.iteration}*\n\n`);
                }
                break;

              case 'tool_call':
                if (data.toolCall) {
                  setStatus('executing_tool');
                  const toolName = data.toolCall.toolName;
                  const args = data.toolCall.arguments as { path?: string };
                  addActivityLog('read', args.path || 'unknown');
                  
                  const toolCallId = addToolCall(messageId, toolName, data.toolCall.arguments);
                  updateToolCallStatus(messageId, toolCallId, 'executing');
                }
                break;

              case 'tool_result':
                if (data.toolResult) {
                  const result = data.toolResult as ToolExecutionResult;
                  setStatus('writing');
                  
                  const message = useChatStore.getState().messages.find(m => m.id === messageId);
                  if (message?.toolCalls && message.toolCalls.length > 0) {
                    const lastToolCall = message.toolCalls[message.toolCalls.length - 1];
                    updateToolCallStatus(
                      messageId, 
                      lastToolCall.id, 
                      result.success ? 'completed' : 'error',
                      {
                        success: result.success,
                        data: result.data,
                        error: result.error,
                      }
                    );
                  }
                }
                break;

              case 'file_operation':
                if (data.fileOperation) {
                  const op = data.fileOperation;
                  const fileName = op.path.split('/').pop() || op.path;
                  
                  if (op.type === 'create') {
                    createFile(op.path, op.content || '');
                    addActivityLog('created', op.path);
                    addFileOperation(messageId, 'created', op.path);
                    openFile(op.path, fileName);
                    setCurrentFile(op.path);
                  } else if (op.type === 'update') {
                    updateFile(op.path, op.content || '');
                    addActivityLog('updated', op.path);
                    addFileOperation(messageId, 'updated', op.path);
                    setCurrentFile(op.path);
                  } else if (op.type === 'delete') {
                    const existingFile = getFileByPath(op.path);
                    if (existingFile) {
                      deleteFile(op.path);
                      addActivityLog('deleted', op.path);
                      addFileOperation(messageId, 'deleted', op.path);
                      toast.success(`Deleted: ${fileName}`);
                    } else {
                      addActivityLog('skipped', op.path);
                      addFileOperation(messageId, 'skipped', op.path, 'File not found');
                      toast.warning(`Skipped: ${fileName} (file not found)`);
                    }
                  }
                }
                break;

              case 'error':
                throw new Error(data.message || 'Unknown error');

              case 'done':
                break;
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      finalizeMessage(messageId);
      currentAssistantMessageIdRef.current = null;
      setStatus('completed');
      setCurrentFile(null);

      setTimeout(() => {
        if (useAgentStore.getState().status === 'completed') {
          setStatus('idle');
        }
      }, 2000);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        if (currentAssistantMessageIdRef.current) {
          markMessageCancelled(currentAssistantMessageIdRef.current);
        }
        setStatus('idle');
        currentAssistantMessageIdRef.current = null;
        return;
      }

      const message = error instanceof Error ? error.message : 'An error occurred';
      setError(message);
      agentSetError(message);
      toast.error(message);
      currentAssistantMessageIdRef.current = null;
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

      </div>

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
                  
                  {/* Thinking Dropdown */}
                  {message.thinking && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="ml-0 mr-9"
                    >
                      <div className="rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedThinking(prev => ({
                            ...prev,
                            [message.id]: !prev[message.id]
                          }))}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-[#272729] transition-colors text-xs"
                        >
                          {expandedThinking[message.id] ? (
                            <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                          )}
                          <Brain className="w-3.5 h-3.5 text-purple-400" />
                          <span className="font-medium text-purple-400">Thinking</span>
                          {message.thinking.isStreaming && (
                            <Loader2 className="w-3 h-3 animate-spin text-purple-400 ml-1" />
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
                              <div className="pl-7 pr-2 pb-2 pt-1">
                                {message.thinking.isStreaming && !message.thinking.reasoning ? (
                                  <div className="flex items-center gap-2 text-xs text-[#7a7a7c]">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Understanding your request...
                                  </div>
                                ) : (
                                  <p className="text-xs text-[#9a9a9c] leading-relaxed italic">
                                    {message.thinking.reasoning}
                                    {message.thinking.isStreaming && (
                                      <span className="inline-block w-1 h-3 ml-0.5 bg-purple-400 animate-pulse align-middle" />
                                    )}
                                  </p>
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
                <div className="space-y-2">
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
                  
                  {/* Tool Calls */}
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <ToolCallsList 
                      toolCalls={message.toolCalls}
                      activeToolCallId={activeToolCallId}
                    />
                  )}
                  
                  {/* Inline File Operations */}
                  {message.fileOperations && message.fileOperations.length > 0 && (
                    <FileOperationsInline 
                      operations={message.fileOperations} 
                      isStreaming={message.isStreaming}
                    />
                  )}
                  
                  {/* Continue Button - Show when message was cancelled */}
                  {message.wasCancelled && !isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 pt-2"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-amber-400">
                        <Square className="w-3 h-3" />
                        <span>Stopped</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleContinue}
                        className="h-7 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
                      >
                        <Play className="w-3 h-3" />
                        Continue
                      </Button>
                    </motion.div>
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
