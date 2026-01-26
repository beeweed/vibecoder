'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, Loader2, CheckCircle2, XCircle, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolCallState } from '@/types/chat';
import type { ReadFileOutput } from '@/types/tools';

interface ToolCallIndicatorProps {
  toolCall: ToolCallState;
  isActive?: boolean;
}

const toolConfig = {
  read_file: {
    icon: FileSearch,
    label: 'Read file',
    activeLabel: 'Reading',
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/50',
    borderColor: 'border-blue-800/50',
  },
};

export function ToolCallIndicator({ toolCall, isActive = false }: ToolCallIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const config = toolConfig[toolCall.name as keyof typeof toolConfig] || {
    icon: FileText,
    label: toolCall.name,
    activeLabel: `Executing ${toolCall.name}…`,
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/50',
    borderColor: 'border-purple-800/50',
  };

  const Icon = config.icon;
  const filePath = (toolCall.arguments as { path?: string })?.path || '';
  const isExecuting = toolCall.status === 'pending' || toolCall.status === 'executing';
  const isCompleted = toolCall.status === 'completed';
  const isError = toolCall.status === 'error';
  
  // Get file content from result if available
  const fileData = toolCall.result?.data as ReadFileOutput | undefined;
  const fileContent = fileData?.content;
  const isTruncated = fileData?.truncated;
  const lineCount = fileData?.lineCount;

  const getStatusIcon = () => {
    if (isExecuting) {
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />;
    }
    if (isCompleted) {
      return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
    }
    if (isError) {
      return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    }
    return null;
  };

  const getStatusText = () => {
    if (isExecuting) {
      return `${config.activeLabel} ${filePath}`;
    }
    if (isCompleted) {
      return `${config.label} ${filePath}`;
    }
    if (isError) {
      return `Failed to read ${filePath}`;
    }
    return config.label;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -5, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={() => isCompleted && fileContent && setIsExpanded(!isExpanded)}
        disabled={!isCompleted || !fileContent}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left',
          config.bgColor,
          config.borderColor,
          isExecuting && 'animate-pulse',
          isCompleted && fileContent && 'cursor-pointer hover:bg-blue-950/70',
          (!isCompleted || !fileContent) && 'cursor-default'
        )}
      >
        {/* Expand/Collapse chevron */}
        {isCompleted && fileContent ? (
          isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          )
        ) : (
          <div className="w-3.5 flex-shrink-0" />
        )}
        
        {/* Icon */}
        <Icon className={cn('w-4 h-4 flex-shrink-0', config.color)} />
        
        {/* Status text with file path */}
        <div className="flex-1 min-w-0">
          <span className={cn('text-xs font-medium', isError ? 'text-red-400' : config.color)}>
            {getStatusText()}
          </span>
          {isCompleted && lineCount && (
            <span className="text-xs text-[#7a7a7c] ml-2">
              ({lineCount} lines{isTruncated ? ', truncated' : ''})
            </span>
          )}
        </div>
        
        {/* Status icon */}
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
      </button>
      
      {/* Expandable content - File content dropdown */}
      <AnimatePresence>
        {isExpanded && isCompleted && fileContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 ml-6 mr-2">
              <div className="bg-[#1e1e20] border border-[#3a3a3c] rounded-lg overflow-hidden">
                <div className="max-h-[300px] overflow-auto">
                  <pre className="p-3 text-xs font-mono text-[#b0b0b2] whitespace-pre-wrap break-all">
                    {fileContent}
                  </pre>
                </div>
                {isTruncated && (
                  <div className="px-3 py-1.5 bg-amber-950/30 border-t border-amber-800/30 text-xs text-amber-400">
                    ⚠️ File content was truncated due to size limits
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Error message */}
      {isError && toolCall.result?.error && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-1 ml-6 mr-2 px-3 py-2 bg-red-950/30 border border-red-800/30 rounded-lg text-xs text-red-400"
        >
          {toolCall.result.error}
        </motion.div>
      )}
    </motion.div>
  );
}

interface ToolCallsListProps {
  toolCalls: ToolCallState[];
  activeToolCallId?: string | null;
}

export function ToolCallsList({ toolCalls, activeToolCallId }: ToolCallsListProps) {
  if (toolCalls.length === 0) return null;

  return (
    <div className="space-y-2 py-2">
      <AnimatePresence mode="popLayout">
        {toolCalls.map((toolCall) => (
          <ToolCallIndicator
            key={toolCall.id}
            toolCall={toolCall}
            isActive={toolCall.id === activeToolCallId}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ActiveToolCallBannerProps {
  toolName: string;
  filePath?: string;
}

export function ActiveToolCallBanner({ toolName, filePath }: ActiveToolCallBannerProps) {
  const config = toolConfig[toolName as keyof typeof toolConfig] || {
    icon: FileText,
    label: toolName,
    activeLabel: `Executing ${toolName}…`,
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/50',
    borderColor: 'border-purple-800/50',
  };

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border mb-2',
        config.bgColor,
        config.borderColor
      )}
    >
      <Loader2 className={cn('w-4 h-4 animate-spin', config.color)} />
      <Icon className={cn('w-4 h-4', config.color)} />
      <span className={cn('text-xs font-medium', config.color)}>
        {config.activeLabel} {filePath}
      </span>
    </motion.div>
  );
}
