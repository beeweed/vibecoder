'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, Loader2, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolCallState } from '@/types/chat';

interface ToolCallIndicatorProps {
  toolCall: ToolCallState;
  isActive?: boolean;
}

const toolConfig = {
  read_file: {
    icon: FileSearch,
    label: 'Reading file',
    activeLabel: 'Reading file from project…',
    color: 'text-blue-400',
    bgColor: 'bg-blue-950/50',
    borderColor: 'border-blue-800/50',
  },
};

export function ToolCallIndicator({ toolCall, isActive = false }: ToolCallIndicatorProps) {
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
  const fileName = filePath.split('/').pop() || filePath;

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'pending':
      case 'executing':
        return <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />;
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
      case 'error':
        return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      default:
        return null;
    }
  };

  const isExecuting = toolCall.status === 'pending' || toolCall.status === 'executing';

  return (
    <motion.div
      initial={{ opacity: 0, y: -5, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
        config.bgColor,
        config.borderColor,
        isExecuting && 'animate-pulse'
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Icon className={cn('w-4 h-4 flex-shrink-0', config.color)} />
        <div className="flex flex-col min-w-0">
          <span className={cn('text-xs font-medium', config.color)}>
            {isExecuting ? config.activeLabel : config.label}
          </span>
          {filePath && (
            <span className="text-xs text-[#9a9a9c] truncate" title={filePath}>
              {fileName}
            </span>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>
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
  const fileName = filePath?.split('/').pop() || filePath;

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
        {config.activeLabel}
      </span>
      {fileName && (
        <code className="text-xs text-[#dcdcde] bg-[#272729] px-1.5 py-0.5 rounded">
          {fileName}
        </code>
      )}
    </motion.div>
  );
}
