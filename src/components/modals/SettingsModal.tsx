'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, RefreshCw, Loader2, Trash2, Zap, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useSettingsStore, type Provider } from '@/stores/settingsStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function SettingsModal() {
  const {
    isSettingsOpen,
    setSettingsOpen,
    provider,
    setProvider,
    apiKey,
    setApiKey,
    groqApiKey,
    setGroqApiKey,
    setAvailableModels,
    clearSettings,
  } = useSettingsStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [showGroqApiKey, setShowGroqApiKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [localGroqApiKey, setLocalGroqApiKey] = useState(groqApiKey || '');
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    setLocalApiKey(apiKey || '');
  }, [apiKey]);

  useEffect(() => {
    setLocalGroqApiKey(groqApiKey || '');
  }, [groqApiKey]);

  const handleSaveOpenRouterKey = async () => {
    setApiKey(localApiKey || null);
    if (localApiKey && provider === 'openrouter') {
      await fetchModels('openrouter', localApiKey);
      toast.success('OpenRouter API key saved');
    } else if (!localApiKey) {
      if (provider === 'openrouter') setAvailableModels([]);
      toast.success('OpenRouter API key cleared');
    } else {
      toast.success('OpenRouter API key saved');
    }
  };

  const handleSaveGroqKey = async () => {
    setGroqApiKey(localGroqApiKey || null);
    if (localGroqApiKey && provider === 'groq') {
      await fetchModels('groq', localGroqApiKey);
      toast.success('Groq API key saved');
    } else if (!localGroqApiKey) {
      if (provider === 'groq') setAvailableModels([]);
      toast.success('Groq API key cleared');
    } else {
      toast.success('Groq API key saved');
    }
  };

  const fetchModels = async (prov: Provider, key: string) => {
    setIsLoadingModels(true);
    try {
      const endpoint = prov === 'groq' ? '/api/models/groq' : '/api/models';
      const response = await fetch(endpoint, {
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

  const handleProviderChange = async (newProvider: Provider) => {
    setProvider(newProvider);
    const key = newProvider === 'groq' ? groqApiKey : apiKey;
    if (key) {
      await fetchModels(newProvider, key);
    }
  };

  const handleClearSettings = () => {
    clearSettings();
    setLocalApiKey('');
    setLocalGroqApiKey('');
    toast.success('Settings cleared');
  };

  const handleRefreshModels = async () => {
    const key = provider === 'groq' ? groqApiKey : apiKey;
    if (key) {
      await fetchModels(provider, key);
    }
  };

  const activeKey = provider === 'groq' ? groqApiKey : apiKey;

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">
              AI Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleProviderChange('openrouter')}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all',
                  provider === 'openrouter'
                    ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                )}
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">OpenRouter</span>
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange('groq')}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all',
                  provider === 'groq'
                    ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                )}
              >
                <Zap className="w-4 h-4" />
                <span className="font-medium">Groq</span>
              </button>
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* OpenRouter API Key */}
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
                onClick={handleSaveOpenRouterKey}
                disabled={isLoadingModels}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {isLoadingModels && provider === 'openrouter' ? (
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

          {/* Groq API Key */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-300">
              Groq API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showGroqApiKey ? 'text' : 'password'}
                  value={localGroqApiKey}
                  onChange={(e) => setLocalGroqApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="pr-10 bg-zinc-800 border-zinc-700"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowGroqApiKey(!showGroqApiKey)}
                >
                  {showGroqApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <Button
                onClick={handleSaveGroqKey}
                disabled={isLoadingModels}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isLoadingModels && provider === 'groq' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </Button>
            </div>
            <p className="text-xs text-zinc-500">
              Get your API key from{' '}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:underline"
              >
                console.groq.com/keys
              </a>
            </p>
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
            {activeKey && (
              <Button
                variant="outline"
                onClick={handleRefreshModels}
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
