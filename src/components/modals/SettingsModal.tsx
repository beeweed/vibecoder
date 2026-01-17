'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, RefreshCw, Loader2, Trash2, Zap, Globe, MessageSquare, Rocket } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    cohereApiKey,
    setCohereApiKey,
    chutesApiKey,
    setChutesApiKey,
    setAvailableModels,
    clearSettings,
  } = useSettingsStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [showGroqApiKey, setShowGroqApiKey] = useState(false);
  const [showCohereApiKey, setShowCohereApiKey] = useState(false);
  const [showChutesApiKey, setShowChutesApiKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [localGroqApiKey, setLocalGroqApiKey] = useState(groqApiKey || '');
  const [localCohereApiKey, setLocalCohereApiKey] = useState(cohereApiKey || '');
  const [localChutesApiKey, setLocalChutesApiKey] = useState(chutesApiKey || '');
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    setLocalApiKey(apiKey || '');
  }, [apiKey]);

  useEffect(() => {
    setLocalGroqApiKey(groqApiKey || '');
  }, [groqApiKey]);

  useEffect(() => {
    setLocalCohereApiKey(cohereApiKey || '');
  }, [cohereApiKey]);

  useEffect(() => {
    setLocalChutesApiKey(chutesApiKey || '');
  }, [chutesApiKey]);

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

  const handleSaveCohereKey = async () => {
    setCohereApiKey(localCohereApiKey || null);
    if (localCohereApiKey && provider === 'cohere') {
      await fetchModels('cohere', localCohereApiKey);
      toast.success('Cohere API key saved');
    } else if (!localCohereApiKey) {
      if (provider === 'cohere') setAvailableModels([]);
      toast.success('Cohere API key cleared');
    } else {
      toast.success('Cohere API key saved');
    }
  };

  const handleSaveChutesKey = async () => {
    setChutesApiKey(localChutesApiKey || null);
    if (localChutesApiKey && provider === 'chutes') {
      await fetchModels('chutes', localChutesApiKey);
      toast.success('Chutes API key saved');
    } else if (!localChutesApiKey) {
      if (provider === 'chutes') setAvailableModels([]);
      toast.success('Chutes API key cleared');
    } else {
      toast.success('Chutes API key saved');
    }
  };

  const fetchModels = async (prov: Provider, key: string) => {
    setIsLoadingModels(true);
    try {
      let endpoint = '/api/models';
      if (prov === 'groq') endpoint = '/api/models/groq';
      else if (prov === 'cohere') endpoint = '/api/models/cohere';
      else if (prov === 'chutes') endpoint = '/api/models/chutes';
      
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
    let key: string | null = null;
    if (newProvider === 'groq') key = groqApiKey;
    else if (newProvider === 'cohere') key = cohereApiKey;
    else if (newProvider === 'chutes') key = chutesApiKey;
    else key = apiKey;
    
    if (key) {
      await fetchModels(newProvider, key);
    }
  };

  const handleClearSettings = () => {
    clearSettings();
    setLocalApiKey('');
    setLocalGroqApiKey('');
    setLocalCohereApiKey('');
    setLocalChutesApiKey('');
    toast.success('Settings cleared');
  };

  const handleRefreshModels = async () => {
    let key: string | null = null;
    if (provider === 'groq') key = groqApiKey;
    else if (provider === 'cohere') key = cohereApiKey;
    else if (provider === 'chutes') key = chutesApiKey;
    else key = apiKey;
    
    if (key) {
      await fetchModels(provider, key);
    }
  };

  const getActiveKey = (): string | null => {
    if (provider === 'groq') return groqApiKey;
    if (provider === 'cohere') return cohereApiKey;
    if (provider === 'chutes') return chutesApiKey;
    return apiKey;
  };

  const activeKey = getActiveKey();

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
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
                    'flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border transition-all text-sm',
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
                    'flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border transition-all text-sm',
                    provider === 'groq'
                      ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  )}
                >
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">Groq</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange('cohere')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border transition-all text-sm',
                    provider === 'cohere'
                      ? 'bg-red-500/20 border-red-400 text-red-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-medium">Cohere</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange('chutes')}
                  className={cn(
                    'flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border transition-all text-sm',
                    provider === 'chutes'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  )}
                >
                  <Rocket className="w-4 h-4" />
                  <span className="font-medium">Chutes</span>
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

            {/* Cohere API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-300">
                Cohere API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showCohereApiKey ? 'text' : 'password'}
                    value={localCohereApiKey}
                    onChange={(e) => setLocalCohereApiKey(e.target.value)}
                    placeholder="..."
                    className="pr-10 bg-zinc-800 border-zinc-700"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowCohereApiKey(!showCohereApiKey)}
                  >
                    {showCohereApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleSaveCohereKey}
                  disabled={isLoadingModels}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isLoadingModels && provider === 'cohere' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                Get your API key from{' '}
                <a
                  href="https://dashboard.cohere.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 hover:underline"
                >
                  dashboard.cohere.com/api-keys
                </a>
              </p>
            </div>

            {/* Chutes API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-300">
                Chutes API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showChutesApiKey ? 'text' : 'password'}
                    value={localChutesApiKey}
                    onChange={(e) => setLocalChutesApiKey(e.target.value)}
                    placeholder="cpk_..."
                    className="pr-10 bg-zinc-800 border-zinc-700"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowChutesApiKey(!showChutesApiKey)}
                  >
                    {showChutesApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleSaveChutesKey}
                  disabled={isLoadingModels}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {isLoadingModels && provider === 'chutes' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                Get your API key from{' '}
                <a
                  href="https://chutes.ai/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  chutes.ai/app
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
                Clear All
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
                  Refresh
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
