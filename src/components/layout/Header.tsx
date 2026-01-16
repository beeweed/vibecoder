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
    <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            VibeCoder
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={selectedModel}
          onValueChange={setSelectedModel}
          disabled={!apiKey || isLoadingModels}
        >
          <SelectTrigger className="w-[280px] bg-zinc-900 border-zinc-700">
            {isLoadingModels ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading models...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select a model" />
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
          className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
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
          className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
