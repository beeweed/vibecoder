'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  SkipForward,
  ListTodo,
  FileCode,
  Trash2,
  Target,
  Sparkles,
} from 'lucide-react';
import type { AgentPlanDisplay, PlanStepDisplay, FileOperation, ToolCallState } from '@/types/chat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { ToolCallsList } from './ToolCallIndicator';
import { useEditorStore } from '@/stores/editorStore';

interface AgentPlanProps {
  plan: AgentPlanDisplay;
  activeToolCallId: string | null;
}

function StepStatusIcon({ status, isStreaming }: { status: PlanStepDisplay['status']; isStreaming?: boolean }) {
  if (isStreaming) {
    return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
  }

  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    case 'in_progress':
      return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    case 'skipped':
      return <SkipForward className="w-4 h-4 text-amber-400" />;
    default:
      return <Circle className="w-4 h-4 text-[#5a5a5c]" />;
  }
}

function StepFileOperations({ 
  operations, 
  isStreaming 
}: { 
  operations: FileOperation[]; 
  isStreaming?: boolean;
}) {
  const openFile = useEditorStore((s) => s.openFile);

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'created': 
        return { 
          label: 'Created', 
          icon: FileCode, 
          bgColor: 'bg-green-950/50',
          textColor: 'text-green-400',
          fileColor: 'text-green-300',
          hoverBg: 'hover:bg-green-950/70'
        };
      case 'updated': 
        return { 
          label: 'Updated', 
          icon: FileCode, 
          bgColor: 'bg-blue-950/50',
          textColor: 'text-blue-400',
          fileColor: 'text-blue-300',
          hoverBg: 'hover:bg-blue-950/70'
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
    if (op.action === 'deleted' || op.action === 'skipped') return;
    openFile(op.filePath, op.fileName);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2">
      {operations.map((op) => {
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
              "flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors text-[10px] group",
              config.bgColor,
              isClickable ? config.hoverBg : 'cursor-default',
            )}
          >
            <IconComponent className={cn("w-3 h-3", config.textColor)} />
            <span className={cn(isClickable && "group-hover:underline", config.fileColor)}>
              {op.fileName}
            </span>
            {isStreaming && op === operations[operations.length - 1] && (
              <Loader2 className="w-2.5 h-2.5 animate-spin text-[#9a9a9c]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function PlanStep({ 
  step, 
  isExpanded, 
  onToggle,
  activeToolCallId,
}: { 
  step: PlanStepDisplay; 
  isExpanded: boolean; 
  onToggle: () => void;
  activeToolCallId: string | null;
}) {
  const statusColors = {
    pending: 'border-[#3a3a3c]',
    in_progress: 'border-blue-500/50 bg-blue-950/20',
    completed: 'border-green-500/50 bg-green-950/10',
    error: 'border-red-500/50 bg-red-950/20',
    skipped: 'border-amber-500/50 bg-amber-950/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "border rounded-lg overflow-hidden transition-colors",
        statusColors[step.status]
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#272729]/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <StepStatusIcon status={step.status} isStreaming={step.isStreaming} />
          <span className="text-xs font-medium text-[#9a9a9c]">
            Step {step.stepNumber}
          </span>
          <span className="text-sm text-[#dcdcde] truncate">
            {step.title}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[#7a7a7c] flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#7a7a7c] flex-shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-[#272729]">
              <p className="text-xs text-[#7a7a7c] mb-2">{step.description}</p>
              
              {step.content && (
                <div className="text-xs text-[#b0b0b2] leading-relaxed" style={{ wordBreak: 'break-word' }}>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc ml-3 mb-2 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal ml-3 mb-2 space-y-0.5">{children}</ol>,
                      code: ({ children }) => (
                        <code className="bg-[#272729] px-1 py-0.5 rounded text-[10px] font-mono text-[#dcdcde]">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-[#272729] p-2 rounded text-[10px] overflow-x-auto my-2">
                          {children}
                        </pre>
                      ),
                      strong: ({ children }) => <strong className="font-semibold text-[#dcdcde]">{children}</strong>,
                    }}
                  >
                    {step.content}
                  </ReactMarkdown>
                  {step.isStreaming && (
                    <span className="inline-block w-1 h-3 ml-0.5 bg-blue-400 animate-pulse align-middle" />
                  )}
                </div>
              )}

              {step.toolCalls && step.toolCalls.length > 0 && (
                <div className="mt-2">
                  <ToolCallsList 
                    toolCalls={step.toolCalls}
                    activeToolCallId={activeToolCallId}
                  />
                </div>
              )}

              {step.fileOperations && step.fileOperations.length > 0 && (
                <StepFileOperations 
                  operations={step.fileOperations} 
                  isStreaming={step.isStreaming}
                />
              )}

              {step.error && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="w-3 h-3" />
                  <span>{step.error}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AgentPlanDisplayComponent({ plan, activeToolCallId }: AgentPlanProps) {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [isPlanExpanded, setIsPlanExpanded] = useState(true);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const completedCount = plan.steps.filter(s => s.status === 'completed').length;
  const inProgressStep = plan.steps.find(s => s.status === 'in_progress');

  if (inProgressStep && !expandedSteps[inProgressStep.id]) {
    setExpandedSteps(prev => ({ ...prev, [inProgressStep.id]: true }));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="rounded-lg border border-[#3a3a3c] overflow-hidden">
        <button
          type="button"
          onClick={() => setIsPlanExpanded(!isPlanExpanded)}
          className="w-full flex items-center gap-2 px-3 py-2 bg-[#1e1e20] hover:bg-[#272729] transition-colors"
        >
          <ListTodo className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-400">Execution Plan</span>
          <span className="text-xs text-[#7a7a7c] ml-auto mr-2">
            {completedCount}/{plan.steps.length} steps
          </span>
          {isPlanExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#7a7a7c]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#7a7a7c]" />
          )}
        </button>

        <AnimatePresence>
          {isPlanExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 space-y-3 border-t border-[#272729]">
                <div className="flex items-start gap-2 pb-2 border-b border-[#272729]">
                  <Target className="w-4 h-4 text-[#9a9a9c] mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs text-[#7a7a7c]">Goal:</span>
                    <p className="text-sm text-[#dcdcde]">{plan.goal}</p>
                  </div>
                </div>

                {plan.isStreaming && !plan.steps.length && plan.rawContent && (
                  <div className="text-xs text-[#9a9a9c] font-mono bg-[#272729] p-2 rounded">
                    {plan.rawContent}
                    <span className="inline-block w-1 h-3 ml-0.5 bg-purple-400 animate-pulse align-middle" />
                  </div>
                )}

                {plan.steps.length > 0 && (
                  <div className="space-y-2">
                    {plan.steps.map((step) => (
                      <PlanStep
                        key={step.id}
                        step={step}
                        isExpanded={expandedSteps[step.id] || false}
                        onToggle={() => toggleStep(step.id)}
                        activeToolCallId={activeToolCallId}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function CompletionSummary({ 
  summary, 
  isStreaming 
}: { 
  summary: string; 
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
          {summary}
        </ReactMarkdown>
        {isStreaming && (
          <span className="inline-block w-1 h-3 ml-0.5 bg-green-400 animate-pulse align-middle" />
        )}
      </div>
    </motion.div>
  );
}
