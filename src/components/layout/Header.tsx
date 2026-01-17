'use client';

import { useState, useEffect, useMemo } from 'react';
import { Settings, Download, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettingsStore } from '@/stores/settingsStore';
import { useFileSystemStore } from '@/stores/fileSystemStore';
import { toast } from 'sonner';
import type { VirtualFile } from '@/types/files';

export function Header() {
  const {
    apiKey,
    selectedModel,
    setSelectedModel,
    availableModels,
    setAvailableModels,
    setSettingsOpen,
  } = useSettingsStore();
  const nodes = useFileSystemStore((s) => s.nodes);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const allFiles = useMemo(() => {
    return Object.values(nodes).filter((n) => n.type === 'file') as VirtualFile[];
  }, [nodes]);

  useEffect(() => {
    if (apiKey && availableModels.length === 0) {
      fetchModels();
    }
  }, [apiKey, availableModels.length]);

  const fetchModels = async () => {
    if (!apiKey) return;
    setIsLoadingModels(true);
    try {
      const response = await fetch('/api/models', {
        headers: { 'X-API-Key': apiKey },
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
        {/* Model selector - hidden on small screens, visible on medium+ */}
        <Select
          value={selectedModel}
          onValueChange={setSelectedModel}
          disabled={!apiKey || isLoadingModels}
        >
          <SelectTrigger className="hidden sm:flex w-[180px] md:w-[280px] bg-zinc-900 border-zinc-700">
            {isLoadingModels ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden md:inline">Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select model" />
            )}
          </SelectTrigger>
          <SelectContent className="max-h-[400px]">
            {availableModels.length > 0 ? (
              availableModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <span className="truncate">{model.name}</span>
                </SelectItem>
              ))
            ) : (
              <SelectItem value="anthropic/claude-sonnet-4" disabled={!apiKey}>
                {apiKey ? 'No models available' : 'Add API key first'}
              </SelectItem>
            )}
          </SelectContent>
        </Select>

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
