'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Loader2,
  FileCode,
  FileSearch,
  Trash2,
  SkipForward,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { AgentLoopState, AgentActionBlock, FileOperation, ToolCallState } from '@/types/chat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';

interface AgentLoopDisplayProps {
  agentLoop: AgentLoopState;
  activeToolCallId: string | null;
}

function ThoughtBlock({ 
  thought, 
  isStreaming 
}: { 
  thought: string; 
  isStreaming?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 px-3 py-2 bg-purple-950/30 border border-purple-500/30 rounded-lg"
    >
      <Brain className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-purple-400 block mb-0.5">Thought</span>
        <p className="text-sm text-purple-200/90 leading-relaxed">
          {thought}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-purple-400 animate-pulse align-middle" />
          )}
        </p>
      </div>
    </motion.div>
  );
}

function ToolCallBlock({
  toolCall,
  isActive,
}: {
  toolCall: ToolCallState;
  isActive: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const filePath = (toolCall.arguments as { path?: string })?.path || '';
  const fileName = filePath.split('/').pop() || filePath;

  const statusIcon = {
    pending: <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />,
    executing: <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />,
    completed: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
    error: <AlertCircle className="w-3.5 h-3.5 text-red-400" />,
  };

  const fileContent = toolCall.result?.success 
    ? (toolCall.result.data as { content?: string })?.content 
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "border rounded-lg overflow-hidden transition-colors",
        isActive ? "border-blue-500/50 bg-blue-950/20" : "border-[#3a3a3c]"
      )}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#272729]/50 transition-colors text-left"
      >
        <FileSearch className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-medium text-blue-400">Reading</span>
        <span className="text-sm text-[#dcdcde] truncate flex-1">{fileName}</span>
        {statusIcon[toolCall.status]}
        {fileContent && (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#7a7a7c]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#7a7a7c]" />
          )
        )}
      </button>

      <AnimatePresence>
        {isExpanded && fileContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 border-t border-[#272729]">
              <pre className="text-xs text-[#9a9a9c] bg-[#1a1a1c] p-2 rounded mt-2 overflow-x-auto max-h-48">
                {fileContent}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {toolCall.status === 'error' && toolCall.result?.error && (
        <div className="px-3 pb-2 text-xs text-red-400">
          Error: {toolCall.result.error}
        </div>
      )}
    </motion.div>
  );
}

function FileOperationBlock({
  fileOperation,
  isStreaming,
}: {
  fileOperation: FileOperation;
  isStreaming?: boolean;
}) {
  const openFile = useEditorStore((s) => s.openFile);

  const actionConfig = {
    created: {
      label: 'Created',
      icon: FileCode,
      bgColor: 'bg-green-950/30',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      fileColor: 'text-green-300',
    },
    updated: {
      label: 'Updated',
      icon: FileCode,
      bgColor: 'bg-blue-950/30',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      fileColor: 'text-blue-300',
    },
    deleted: {
      label: 'Deleted',
      icon: Trash2,
      bgColor: 'bg-red-950/30',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      fileColor: 'text-red-300',
    },
    skipped: {
      label: 'Skipped',
      icon: SkipForward,
      bgColor: 'bg-amber-950/30',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
      fileColor: 'text-amber-300',
    },
  };

  const config = actionConfig[fileOperation.action];
  const IconComponent = config.icon;
  const isClickable = fileOperation.action !== 'deleted' && fileOperation.action !== 'skipped';

  const handleClick = () => {
    if (isClickable) {
      openFile(fileOperation.filePath, fileOperation.fileName);
    }
  };

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleClick}
      disabled={!isClickable}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors w-full text-left",
        config.bgColor,
        config.borderColor,
        isClickable && "hover:bg-opacity-50 cursor-pointer"
      )}
    >
      <IconComponent className={cn("w-4 h-4", config.textColor)} />
      <span className={cn("text-xs font-medium", config.textColor)}>{config.label}</span>
      <span className={cn("text-sm truncate flex-1", config.fileColor, isClickable && "hover:underline")}>
        {fileOperation.fileName}
      </span>
      {isStreaming && (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9a9a9c]" />
      )}
      {fileOperation.reason && (
        <span className="text-xs text-amber-400/70">({fileOperation.reason})</span>
      )}
    </motion.button>
  );
}

function ResponseBlock({
  response,
  isStreaming,
}: {
  response: string;
  isStreaming?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-3 py-2 bg-[#1e1e20] border border-[#3a3a3c] rounded-lg"
    >
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-4 h-4 text-[#9a9a9c]" />
        <span className="text-xs font-medium text-[#9a9a9c]">Response</span>
      </div>
      <div className="text-sm text-[#dcdcde] leading-relaxed">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
            code: ({ children }) => (
              <code className="bg-[#272729] px-1.5 py-0.5 rounded text-xs font-mono text-[#dcdcde]">
                {children}
              </code>
            ),
            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          }}
        >
          {response}
        </ReactMarkdown>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#dcdcde] animate-pulse align-middle" />
        )}
      </div>
    </motion.div>
  );
}

function ActionBlock({
  action,
  activeToolCallId,
}: {
  action: AgentActionBlock;
  activeToolCallId: string | null;
}) {
  return (
    <div className="space-y-2">
      {action.thought && (
        <ThoughtBlock 
          thought={action.thought} 
          isStreaming={action.thoughtStreaming} 
        />
      )}
      
      {action.toolCall && (
        <ToolCallBlock 
          toolCall={action.toolCall} 
          isActive={activeToolCallId === action.toolCall.id}
        />
      )}
      
      {action.fileOperation && (
        <FileOperationBlock 
          fileOperation={action.fileOperation}
          isStreaming={!action.isComplete}
        />
      )}
      
      {action.response && (
        <ResponseBlock 
          response={action.response} 
          isStreaming={action.responseStreaming} 
        />
      )}
    </div>
  );
}

function FinalResponseBlock({
  response,
  isStreaming,
}: {
  response: string;
  isStreaming?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-green-500/30 bg-green-950/20 p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-green-400" />
        <span className="text-sm font-medium text-green-400">Complete!</span>
      </div>
      <div className="text-sm text-[#b0b0b2] leading-relaxed">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-[#dcdcde]">{children}</strong>,
          }}
        >
          {response}
        </ReactMarkdown>
        {isStreaming && (
          <span className="inline-block w-1 h-3 ml-0.5 bg-green-400 animate-pulse align-middle" />
        )}
      </div>
    </motion.div>
  );
}

export function AgentLoopDisplay({ agentLoop, activeToolCallId }: AgentLoopDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {agentLoop.actions.map((action) => (
        <ActionBlock 
          key={action.id} 
          action={action} 
          activeToolCallId={activeToolCallId}
        />
      ))}

      {agentLoop.isComplete && agentLoop.finalResponse && (
        <FinalResponseBlock 
          response={agentLoop.finalResponse}
          isStreaming={agentLoop.finalResponseStreaming}
        />
      )}
    </motion.div>
  );
}
