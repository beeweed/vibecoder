'use client';

import { useState, useEffect, useMemo } from 'react';
import { Settings, Download, Sparkles, Loader2, Zap, Globe, MessageSquare, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModelSelector } from '@/components/layout/ModelSelector';
import { useSettingsStore } from '@/stores/settingsStore';
import { useFileSystemStore } from '@/stores/fileSystemStore';
import { toast } from 'sonner';
import type { VirtualFile } from '@/types/files';

export function Header() {
  const {
    provider,
    apiKey,
    groqApiKey,
    cohereApiKey,
    chutesApiKey,
    selectedModel,
    setSelectedModel,
    availableModels,
    setAvailableModels,
    setSettingsOpen,
  } = useSettingsStore();
  const nodes = useFileSystemStore((s) => s.nodes);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const getActiveApiKey = (): string | null => {
    if (provider === 'groq') return groqApiKey;
    if (provider === 'cohere') return cohereApiKey;
    if (provider === 'chutes') return chutesApiKey;
    return apiKey;
  };
  
  const activeApiKey = getActiveApiKey();
  
  const allFiles = useMemo(() => {
    return Object.values(nodes).filter((n) => n.type === 'file') as VirtualFile[];
  }, [nodes]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetch on provider change
  useEffect(() => {
    if (activeApiKey && availableModels.length === 0) {
      fetchModels();
    }
  }, [activeApiKey, availableModels.length, provider]);

  const fetchModels = async () => {
    if (!activeApiKey) return;
    setIsLoadingModels(true);
    try {
      let endpoint = '/api/models';
      if (provider === 'groq') endpoint = '/api/models/groq';
      else if (provider === 'cohere') endpoint = '/api/models/cohere';
      else if (provider === 'chutes') endpoint = '/api/models/chutes';
      
      const response = await fetch(endpoint, {
        headers: { 'X-API-Key': activeApiKey },
      });
      const data = await response.json();
      if (data.models) {
        setAvailableModels(data.models);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Failed to fetch models');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleExport = async () => {
    if (allFiles.length === 0) {
      toast.error('No files to export');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: allFiles.map((f) => ({ path: f.path, content: f.content })),
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibecoder-export-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Project exported successfully');
    } catch (error) {
      toast.error('Failed to export project');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <header className="h-14 min-h-[56px] border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-3 md:px-4 flex-shrink-0 relative z-50">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <span className="text-base md:text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent whitespace-nowrap">
            VibeCoder
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Provider indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700">
          {provider === 'groq' ? (
            <Zap className="w-3.5 h-3.5 text-orange-400" />
          ) : provider === 'cohere' ? (
            <MessageSquare className="w-3.5 h-3.5 text-red-400" />
          ) : provider === 'chutes' ? (
            <Rocket className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-violet-400" />
          )}
          <span className="text-xs font-medium text-zinc-400">
            {provider === 'groq' ? 'Groq' : provider === 'cohere' ? 'Cohere' : provider === 'chutes' ? 'Chutes' : 'OpenRouter'}
          </span>
        </div>

        {/* Model selector with search - hidden on small screens, visible on medium+ */}
        <ModelSelector
          models={availableModels}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          isLoading={isLoadingModels}
          disabled={!activeApiKey}
          placeholder={activeApiKey ? 'Select model' : 'Add API key first'}
        />

        <Button
          variant="outline"
          size="icon"
          onClick={handleExport}
          disabled={isExporting}
          className="w-9 h-9 md:w-10 md:h-10 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 flex-shrink-0"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          className="w-9 h-9 md:w-10 md:h-10 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 flex-shrink-0"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
