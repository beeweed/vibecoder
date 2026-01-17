'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, RefreshCw, Loader2, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useSettingsStore } from '@/stores/settingsStore';
import { toast } from 'sonner';

export function SettingsModal() {
  const {
    isSettingsOpen,
    setSettingsOpen,
    apiKey,
    setApiKey,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    setAvailableModels,
    clearSettings,
  } = useSettingsStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    setLocalApiKey(apiKey || '');
  }, [apiKey]);

  const handleSaveApiKey = async () => {
    setApiKey(localApiKey || null);
    if (localApiKey) {
      await fetchModels(localApiKey);
      toast.success('API key saved');
    } else {
      setAvailableModels([]);
      toast.success('API key cleared');
    }
  };

  const fetchModels = async (key: string) => {
    setIsLoadingModels(true);
    try {
      const response = await fetch('/api/models', {
        headers: { 'X-API-Key': key },
      });
      const data = await response.json();
      if (data.models) {
        setAvailableModels(data.models);
        toast.success(`Loaded ${data.models.length} models`);
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Failed to fetch models');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleClearSettings = () => {
    clearSettings();
    setLocalApiKey('');
    toast.success('Settings cleared');
  };

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">
              OpenRouter API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="pr-10 bg-zinc-800 border-zinc-700"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Button
                onClick={handleSaveApiKey}
                disabled={isLoadingModels}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {isLoadingModels ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
            <p className="text-xs text-zinc-500">
              Get your API key from{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:underline"
              >
                openrouter.ai/keys
              </a>
            </p>
          </div>

          <Separator className="bg-zinc-800" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">
                Temperature
              </label>
              <span className="text-sm text-zinc-500">{temperature.toFixed(1)}</span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={([v]) => setTemperature(v)}
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-zinc-500">
              Higher values make output more random, lower values more focused
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">
                Max Tokens
              </label>
              <span className="text-sm text-zinc-500">{maxTokens}</span>
            </div>
            <Slider
              value={[maxTokens]}
              onValueChange={([v]) => setMaxTokens(v)}
              min={256}
              max={32768}
              step={256}
              className="w-full"
            />
          </div>

          <Separator className="bg-zinc-800" />

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClearSettings}
              className="flex-1 border-zinc-700 hover:bg-zinc-800"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Settings
            </Button>
            {apiKey && (
              <Button
                variant="outline"
                onClick={() => fetchModels(apiKey)}
                disabled={isLoadingModels}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isLoadingModels ? 'animate-spin' : ''}`}
                />
                Refresh Models
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
