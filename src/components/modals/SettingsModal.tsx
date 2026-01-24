'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, RefreshCw, Loader2, Trash2, Zap, Globe, MessageSquare, Rocket, Flame, Brain, Bot, Sparkles, Wind, Fish, CircleDot, Hexagon, Atom } from 'lucide-react';
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
    fireworksApiKey,
    setFireworksApiKey,
    cerebrasApiKey,
    setCerebrasApiKey,
    huggingfaceApiKey,
    setHuggingfaceApiKey,
    geminiApiKey,
    setGeminiApiKey,
    mistralApiKey,
    setMistralApiKey,
    deepseekApiKey,
    setDeepseekApiKey,
    openaiApiKey,
    setOpenaiApiKey,
    anthropicApiKey,
    setAnthropicApiKey,
    zaiApiKey,
    setZaiApiKey,
    setAvailableModels,
    clearSettings,
  } = useSettingsStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [showGroqApiKey, setShowGroqApiKey] = useState(false);
  const [showCohereApiKey, setShowCohereApiKey] = useState(false);
  const [showChutesApiKey, setShowChutesApiKey] = useState(false);
  const [showFireworksApiKey, setShowFireworksApiKey] = useState(false);
  const [showCerebrasApiKey, setShowCerebrasApiKey] = useState(false);
  const [showHuggingfaceApiKey, setShowHuggingfaceApiKey] = useState(false);
  const [showGeminiApiKey, setShowGeminiApiKey] = useState(false);
  const [showMistralApiKey, setShowMistralApiKey] = useState(false);
  const [showDeepseekApiKey, setShowDeepseekApiKey] = useState(false);
  const [showOpenaiApiKey, setShowOpenaiApiKey] = useState(false);
  const [showAnthropicApiKey, setShowAnthropicApiKey] = useState(false);
  const [showZaiApiKey, setShowZaiApiKey] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(apiKey || '');
  const [localGroqApiKey, setLocalGroqApiKey] = useState(groqApiKey || '');
  const [localCohereApiKey, setLocalCohereApiKey] = useState(cohereApiKey || '');
  const [localChutesApiKey, setLocalChutesApiKey] = useState(chutesApiKey || '');
  const [localFireworksApiKey, setLocalFireworksApiKey] = useState(fireworksApiKey || '');
  const [localCerebrasApiKey, setLocalCerebrasApiKey] = useState(cerebrasApiKey || '');
  const [localHuggingfaceApiKey, setLocalHuggingfaceApiKey] = useState(huggingfaceApiKey || '');
  const [localGeminiApiKey, setLocalGeminiApiKey] = useState(geminiApiKey || '');
  const [localMistralApiKey, setLocalMistralApiKey] = useState(mistralApiKey || '');
  const [localDeepseekApiKey, setLocalDeepseekApiKey] = useState(deepseekApiKey || '');
  const [localOpenaiApiKey, setLocalOpenaiApiKey] = useState(openaiApiKey || '');
  const [localAnthropicApiKey, setLocalAnthropicApiKey] = useState(anthropicApiKey || '');
  const [localZaiApiKey, setLocalZaiApiKey] = useState(zaiApiKey || '');
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

  useEffect(() => {
    setLocalFireworksApiKey(fireworksApiKey || '');
  }, [fireworksApiKey]);

  useEffect(() => {
    setLocalCerebrasApiKey(cerebrasApiKey || '');
  }, [cerebrasApiKey]);

  useEffect(() => {
    setLocalHuggingfaceApiKey(huggingfaceApiKey || '');
  }, [huggingfaceApiKey]);

  useEffect(() => {
    setLocalGeminiApiKey(geminiApiKey || '');
  }, [geminiApiKey]);

  useEffect(() => {
    setLocalMistralApiKey(mistralApiKey || '');
  }, [mistralApiKey]);

  useEffect(() => {
    setLocalDeepseekApiKey(deepseekApiKey || '');
  }, [deepseekApiKey]);

  useEffect(() => {
    setLocalOpenaiApiKey(openaiApiKey || '');
  }, [openaiApiKey]);

  useEffect(() => {
    setLocalAnthropicApiKey(anthropicApiKey || '');
  }, [anthropicApiKey]);

  useEffect(() => {
    setLocalZaiApiKey(zaiApiKey || '');
  }, [zaiApiKey]);

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

  const handleSaveFireworksKey = async () => {
    setFireworksApiKey(localFireworksApiKey || null);
    if (localFireworksApiKey && provider === 'fireworks') {
      await fetchModels('fireworks', localFireworksApiKey);
      toast.success('Fireworks API key saved');
    } else if (!localFireworksApiKey) {
      if (provider === 'fireworks') setAvailableModels([]);
      toast.success('Fireworks API key cleared');
    } else {
      toast.success('Fireworks API key saved');
    }
  };

  const handleSaveCerebrasKey = async () => {
    setCerebrasApiKey(localCerebrasApiKey || null);
    if (localCerebrasApiKey && provider === 'cerebras') {
      await fetchModels('cerebras', localCerebrasApiKey);
      toast.success('Cerebras API key saved');
    } else if (!localCerebrasApiKey) {
      if (provider === 'cerebras') setAvailableModels([]);
      toast.success('Cerebras API key cleared');
    } else {
      toast.success('Cerebras API key saved');
    }
  };

  const handleSaveHuggingfaceKey = async () => {
    setHuggingfaceApiKey(localHuggingfaceApiKey || null);
    if (localHuggingfaceApiKey && provider === 'huggingface') {
      await fetchModels('huggingface', localHuggingfaceApiKey);
      toast.success('Hugging Face API key saved');
    } else if (!localHuggingfaceApiKey) {
      if (provider === 'huggingface') setAvailableModels([]);
      toast.success('Hugging Face API key cleared');
    } else {
      toast.success('Hugging Face API key saved');
    }
  };

  const handleSaveGeminiKey = async () => {
    setGeminiApiKey(localGeminiApiKey || null);
    if (localGeminiApiKey && provider === 'gemini') {
      await fetchModels('gemini', localGeminiApiKey);
      toast.success('Gemini API key saved');
    } else if (!localGeminiApiKey) {
      if (provider === 'gemini') setAvailableModels([]);
      toast.success('Gemini API key cleared');
    } else {
      toast.success('Gemini API key saved');
    }
  };

  const handleSaveMistralKey = async () => {
    setMistralApiKey(localMistralApiKey || null);
    if (localMistralApiKey && provider === 'mistral') {
      await fetchModels('mistral', localMistralApiKey);
      toast.success('Mistral API key saved');
    } else if (!localMistralApiKey) {
      if (provider === 'mistral') setAvailableModels([]);
      toast.success('Mistral API key cleared');
    } else {
      toast.success('Mistral API key saved');
    }
  };

  const handleSaveDeepseekKey = async () => {
    setDeepseekApiKey(localDeepseekApiKey || null);
    if (localDeepseekApiKey && provider === 'deepseek') {
      await fetchModels('deepseek', localDeepseekApiKey);
      toast.success('DeepSeek API key saved');
    } else if (!localDeepseekApiKey) {
      if (provider === 'deepseek') setAvailableModels([]);
      toast.success('DeepSeek API key cleared');
    } else {
      toast.success('DeepSeek API key saved');
    }
  };

  const handleSaveOpenaiKey = async () => {
    setOpenaiApiKey(localOpenaiApiKey || null);
    if (localOpenaiApiKey && provider === 'openai') {
      await fetchModels('openai', localOpenaiApiKey);
      toast.success('OpenAI API key saved');
    } else if (!localOpenaiApiKey) {
      if (provider === 'openai') setAvailableModels([]);
      toast.success('OpenAI API key cleared');
    } else {
      toast.success('OpenAI API key saved');
    }
  };

  const handleSaveAnthropicKey = async () => {
    setAnthropicApiKey(localAnthropicApiKey || null);
    if (localAnthropicApiKey && provider === 'anthropic') {
      await fetchModels('anthropic', localAnthropicApiKey);
      toast.success('Anthropic API key saved');
    } else if (!localAnthropicApiKey) {
      if (provider === 'anthropic') setAvailableModels([]);
      toast.success('Anthropic API key cleared');
    } else {
      toast.success('Anthropic API key saved');
    }
  };

  const handleSaveZaiKey = async () => {
    setZaiApiKey(localZaiApiKey || null);
    if (localZaiApiKey && provider === 'zai') {
      await fetchModels('zai', localZaiApiKey);
      toast.success('Z.ai API key saved');
    } else if (!localZaiApiKey) {
      if (provider === 'zai') setAvailableModels([]);
      toast.success('Z.ai API key cleared');
    } else {
      toast.success('Z.ai API key saved');
    }
  };

  const fetchModels = async (prov: Provider, key: string) => {
    setIsLoadingModels(true);
    try {
      let endpoint = '/api/models';
      if (prov === 'groq') endpoint = '/api/models/groq';
      else if (prov === 'cohere') endpoint = '/api/models/cohere';
      else if (prov === 'chutes') endpoint = '/api/models/chutes';
      else if (prov === 'fireworks') endpoint = '/api/models/fireworks';
      else if (prov === 'cerebras') endpoint = '/api/models/cerebras';
      else if (prov === 'huggingface') endpoint = '/api/models/huggingface';
      else if (prov === 'gemini') endpoint = '/api/models/gemini';
      else if (prov === 'mistral') endpoint = '/api/models/mistral';
      else if (prov === 'deepseek') endpoint = '/api/models/deepseek';
      else if (prov === 'openai') endpoint = '/api/models/openai';
      else if (prov === 'anthropic') endpoint = '/api/models/anthropic';
      else if (prov === 'zai') endpoint = '/api/models/zai';
      
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
    else if (newProvider === 'fireworks') key = fireworksApiKey;
    else if (newProvider === 'cerebras') key = cerebrasApiKey;
    else if (newProvider === 'huggingface') key = huggingfaceApiKey;
    else if (newProvider === 'gemini') key = geminiApiKey;
    else if (newProvider === 'mistral') key = mistralApiKey;
    else if (newProvider === 'deepseek') key = deepseekApiKey;
    else if (newProvider === 'openai') key = openaiApiKey;
    else if (newProvider === 'anthropic') key = anthropicApiKey;
    else if (newProvider === 'zai') key = zaiApiKey;
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
    setLocalFireworksApiKey('');
    setLocalCerebrasApiKey('');
    setLocalHuggingfaceApiKey('');
    setLocalGeminiApiKey('');
    setLocalMistralApiKey('');
    setLocalDeepseekApiKey('');
    setLocalOpenaiApiKey('');
    setLocalAnthropicApiKey('');
    setLocalZaiApiKey('');
    setLocalCustomInstructions('');
    toast.success('Settings cleared');
  };

  const handleRefreshModels = async () => {
    let key: string | null = null;
    if (provider === 'groq') key = groqApiKey;
    else if (provider === 'cohere') key = cohereApiKey;
    else if (provider === 'chutes') key = chutesApiKey;
    else if (provider === 'fireworks') key = fireworksApiKey;
    else if (provider === 'cerebras') key = cerebrasApiKey;
    else if (provider === 'huggingface') key = huggingfaceApiKey;
    else if (provider === 'gemini') key = geminiApiKey;
    else if (provider === 'mistral') key = mistralApiKey;
    else if (provider === 'deepseek') key = deepseekApiKey;
    else if (provider === 'openai') key = openaiApiKey;
    else if (provider === 'anthropic') key = anthropicApiKey;
    else if (provider === 'zai') key = zaiApiKey;
    else key = apiKey;
    
    if (key) {
      await fetchModels(provider, key);
    }
  };

  const getActiveKey = (): string | null => {
    if (provider === 'groq') return groqApiKey;
    if (provider === 'cohere') return cohereApiKey;
    if (provider === 'chutes') return chutesApiKey;
    if (provider === 'fireworks') return fireworksApiKey;
    if (provider === 'cerebras') return cerebrasApiKey;
    if (provider === 'huggingface') return huggingfaceApiKey;
    if (provider === 'gemini') return geminiApiKey;
    if (provider === 'mistral') return mistralApiKey;
    if (provider === 'deepseek') return deepseekApiKey;
    if (provider === 'openai') return openaiApiKey;
    if (provider === 'anthropic') return anthropicApiKey;
    if (provider === 'zai') return zaiApiKey;
    return apiKey;
  };

  const activeKey = getActiveKey();

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="sm:max-w-[500px] bg-[#1e1e20] border-[#3a3a3c] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#dcdcde]">Settings</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Provider Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#b0b0b2]">
                AI Provider
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleProviderChange('openrouter')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border transition-all text-xs',
                    provider === 'openrouter'
                      ? 'bg-[#272729] border-[#dcdcde] text-[#dcdcde]'
                      : 'bg-[#272729] border-[#3a3a3c] text-[#9a9a9c] hover:bg-[#3a3a3c]'
                  )}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="font-medium">OpenRouter</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange('groq')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border transition-all text-xs',
                    provider === 'groq'
                      ? 'bg-[#272729] border-[#dcdcde] text-[#dcdcde]'
                      : 'bg-[#272729] border-[#3a3a3c] text-[#9a9a9c] hover:bg-[#3a3a3c]'
                  )}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span className="font-medium">Groq</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange('cohere')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border transition-all text-xs',
                    provider === 'cohere'
                      ? 'bg-[#272729] border-[#dcdcde] text-[#dcdcde]'
                      : 'bg-[#272729] border-[#3a3a3c] text-[#9a9a9c] hover:bg-[#3a3a3c]'
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="font-medium">Cohere</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange('chutes')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border transition-all text-xs',
                    provider === 'chutes'
                      ? 'bg-[#272729] border-[#dcdcde] text-[#dcdcde]'
                      : 'bg-[#272729] border-[#3a3a3c] text-[#9a9a9c] hover:bg-[#3a3a3c]'
                  )}
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span className="font-medium">Chutes</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange('fireworks')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border transition-all text-xs',
                    provider === 'fireworks'
                      ? 'bg-[#272729] border-[#dcdcde] text-[#dcdcde]'
                      : 'bg-[#272729] border-[#3a3a3c] text-[#9a9a9c] hover:bg-[#3a3a3c]'
                  )}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span className="font-medium">Fireworks</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange('cerebras')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border transition-all text-xs',
                    provider === 'cerebras'
                      ? 'bg-[#272729] border-[#dcdcde] text-[#dcdcde]'
                      : 'bg-[#272729] border-[#3a3a3c] text-[#9a9a9c] hover:bg-[#3a3a3c]'
                  )}
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span className="font-medium">Cerebras</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange('huggingface')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border transition-all text-xs',
                    provider === 'huggingface'
                      ? 'bg-[#272729] border-[#dcdcde] text-[#dcdcde]'
                      : 'bg-[#272729] border-[#3a3a3c] text-[#9a9a9c] hover:bg-[#3a3a3c]'
                  )}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span className="font-medium">HuggingFace</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange('gemini')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border transition-all text-xs',
                    provider === 'gemini'
                      ? 'bg-[#272729] border-[#dcdcde] text-[#dcdcde]'
                      : 'bg-[#272729] border-[#3a3a3c] text-[#9a9a9c] hover:bg-[#3a3a3c]'
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="font-medium">Gemini</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange('mistral')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border transition-all text-xs',
                    provider === 'mistral'
                      ? 'bg-[#272729] border-[#dcdcde] text-[#dcdcde]'
                      : 'bg-[#272729] border-[#3a3a3c] text-[#9a9a9c] hover:bg-[#3a3a3c]'
                  )}
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span className="font-medium">Mistral</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange('deepseek')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border transition-all text-xs',
                    provider === 'deepseek'
                      ? 'bg-[#272729] border-[#dcdcde] text-[#dcdcde]'
                      : 'bg-[#272729] border-[#3a3a3c] text-[#9a9a9c] hover:bg-[#3a3a3c]'
                  )}
                >
                  <Fish className="w-3.5 h-3.5" />
                  <span className="font-medium">DeepSeek</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange('openai')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border transition-all text-xs',
                    provider === 'openai'
                      ? 'bg-[#272729] border-[#dcdcde] text-[#dcdcde]'
                      : 'bg-[#272729] border-[#3a3a3c] text-[#9a9a9c] hover:bg-[#3a3a3c]'
                  )}
                >
                  <CircleDot className="w-3.5 h-3.5" />
                  <span className="font-medium">OpenAI</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange('anthropic')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border transition-all text-xs',
                    provider === 'anthropic'
                      ? 'bg-[#272729] border-[#dcdcde] text-[#dcdcde]'
                      : 'bg-[#272729] border-[#3a3a3c] text-[#9a9a9c] hover:bg-[#3a3a3c]'
                  )}
                >
                  <Hexagon className="w-3.5 h-3.5" />
                  <span className="font-medium">Anthropic</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleProviderChange('zai')}
                  className={cn(
                    'flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg border transition-all text-xs',
                    provider === 'zai'
                      ? 'bg-[#272729] border-[#dcdcde] text-[#dcdcde]'
                      : 'bg-[#272729] border-[#3a3a3c] text-[#9a9a9c] hover:bg-[#3a3a3c]'
                  )}
                >
                  <Atom className="w-3.5 h-3.5" />
                  <span className="font-medium">Z.ai</span>
                </button>
              </div>
            </div>

            <Separator className="bg-[#3a3a3c]" />

            {/* OpenRouter API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#b0b0b2]">
                OpenRouter API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="pr-10 bg-[#272729] border-[#3a3a3c] text-[#dcdcde]"
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
                  className="bg-[#dcdcde] hover:bg-[#c0c0c2] text-[#161618]"
                >
                  {isLoadingModels && provider === 'openrouter' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#7a7a7c]">
                Get your API key from{' '}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dcdcde] hover:underline"
                >
                  openrouter.ai/keys
                </a>
              </p>
            </div>

            {/* Groq API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#b0b0b2]">
                Groq API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showGroqApiKey ? 'text' : 'password'}
                    value={localGroqApiKey}
                    onChange={(e) => setLocalGroqApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="pr-10 bg-[#272729] border-[#3a3a3c] text-[#dcdcde]"
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
                  className="bg-[#dcdcde] hover:bg-[#c0c0c2] text-[#161618]"
                >
                  {isLoadingModels && provider === 'groq' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#7a7a7c]">
                Get your API key from{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dcdcde] hover:underline"
                >
                  console.groq.com/keys
                </a>
              </p>
            </div>

            {/* Cohere API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#b0b0b2]">
                Cohere API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showCohereApiKey ? 'text' : 'password'}
                    value={localCohereApiKey}
                    onChange={(e) => setLocalCohereApiKey(e.target.value)}
                    placeholder="..."
                    className="pr-10 bg-[#272729] border-[#3a3a3c] text-[#dcdcde]"
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
                  className="bg-[#dcdcde] hover:bg-[#c0c0c2] text-[#161618]"
                >
                  {isLoadingModels && provider === 'cohere' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#7a7a7c]">
                Get your API key from{' '}
                <a
                  href="https://dashboard.cohere.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dcdcde] hover:underline"
                >
                  dashboard.cohere.com/api-keys
                </a>
              </p>
            </div>

            {/* Chutes API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#b0b0b2]">
                Chutes API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showChutesApiKey ? 'text' : 'password'}
                    value={localChutesApiKey}
                    onChange={(e) => setLocalChutesApiKey(e.target.value)}
                    placeholder="cpk_..."
                    className="pr-10 bg-[#272729] border-[#3a3a3c] text-[#dcdcde]"
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
                  className="bg-[#dcdcde] hover:bg-[#c0c0c2] text-[#161618]"
                >
                  {isLoadingModels && provider === 'chutes' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#7a7a7c]">
                Get your API key from{' '}
                <a
                  href="https://chutes.ai/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dcdcde] hover:underline"
                >
                  chutes.ai/app
                </a>
              </p>
            </div>

            {/* Fireworks API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#b0b0b2]">
                Fireworks API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showFireworksApiKey ? 'text' : 'password'}
                    value={localFireworksApiKey}
                    onChange={(e) => setLocalFireworksApiKey(e.target.value)}
                    placeholder="fw_..."
                    className="pr-10 bg-[#272729] border-[#3a3a3c] text-[#dcdcde]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowFireworksApiKey(!showFireworksApiKey)}
                  >
                    {showFireworksApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleSaveFireworksKey}
                  disabled={isLoadingModels}
                  className="bg-[#dcdcde] hover:bg-[#c0c0c2] text-[#161618]"
                >
                  {isLoadingModels && provider === 'fireworks' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#7a7a7c]">
                Get your API key from{' '}
                <a
                  href="https://fireworks.ai/account/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dcdcde] hover:underline"
                >
                  fireworks.ai/account/api-keys
                </a>
              </p>
            </div>

            {/* Cerebras API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#b0b0b2]">
                Cerebras API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showCerebrasApiKey ? 'text' : 'password'}
                    value={localCerebrasApiKey}
                    onChange={(e) => setLocalCerebrasApiKey(e.target.value)}
                    placeholder="csk-..."
                    className="pr-10 bg-[#272729] border-[#3a3a3c] text-[#dcdcde]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowCerebrasApiKey(!showCerebrasApiKey)}
                  >
                    {showCerebrasApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleSaveCerebrasKey}
                  disabled={isLoadingModels}
                  className="bg-[#dcdcde] hover:bg-[#c0c0c2] text-[#161618]"
                >
                  {isLoadingModels && provider === 'cerebras' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#7a7a7c]">
                Get your API key from{' '}
                <a
                  href="https://cloud.cerebras.ai/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dcdcde] hover:underline"
                >
                  cloud.cerebras.ai/api-keys
                </a>
              </p>
            </div>

            {/* Hugging Face API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#b0b0b2]">
                Hugging Face API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showHuggingfaceApiKey ? 'text' : 'password'}
                    value={localHuggingfaceApiKey}
                    onChange={(e) => setLocalHuggingfaceApiKey(e.target.value)}
                    placeholder="hf_..."
                    className="pr-10 bg-[#272729] border-[#3a3a3c] text-[#dcdcde]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowHuggingfaceApiKey(!showHuggingfaceApiKey)}
                  >
                    {showHuggingfaceApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleSaveHuggingfaceKey}
                  disabled={isLoadingModels}
                  className="bg-[#dcdcde] hover:bg-[#c0c0c2] text-[#161618]"
                >
                  {isLoadingModels && provider === 'huggingface' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#7a7a7c]">
                Get your API key from{' '}
                <a
                  href="https://huggingface.co/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dcdcde] hover:underline"
                >
                  huggingface.co/settings/tokens
                </a>
              </p>
            </div>

            {/* Gemini API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#b0b0b2]">
                Gemini API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showGeminiApiKey ? 'text' : 'password'}
                    value={localGeminiApiKey}
                    onChange={(e) => setLocalGeminiApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="pr-10 bg-[#272729] border-[#3a3a3c] text-[#dcdcde]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowGeminiApiKey(!showGeminiApiKey)}
                  >
                    {showGeminiApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleSaveGeminiKey}
                  disabled={isLoadingModels}
                  className="bg-[#dcdcde] hover:bg-[#c0c0c2] text-[#161618]"
                >
                  {isLoadingModels && provider === 'gemini' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#7a7a7c]">
                Get your API key from{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dcdcde] hover:underline"
                >
                  aistudio.google.com/apikey
                </a>
              </p>
            </div>

            {/* Mistral API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#b0b0b2]">
                Mistral API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showMistralApiKey ? 'text' : 'password'}
                    value={localMistralApiKey}
                    onChange={(e) => setLocalMistralApiKey(e.target.value)}
                    placeholder="..."
                    className="pr-10 bg-[#272729] border-[#3a3a3c] text-[#dcdcde]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowMistralApiKey(!showMistralApiKey)}
                  >
                    {showMistralApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleSaveMistralKey}
                  disabled={isLoadingModels}
                  className="bg-[#dcdcde] hover:bg-[#c0c0c2] text-[#161618]"
                >
                  {isLoadingModels && provider === 'mistral' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#7a7a7c]">
                Get your API key from{' '}
                <a
                  href="https://console.mistral.ai/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dcdcde] hover:underline"
                >
                  console.mistral.ai/api-keys
                </a>
              </p>
            </div>

            {/* DeepSeek API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#b0b0b2]">
                DeepSeek API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showDeepseekApiKey ? 'text' : 'password'}
                    value={localDeepseekApiKey}
                    onChange={(e) => setLocalDeepseekApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="pr-10 bg-[#272729] border-[#3a3a3c] text-[#dcdcde]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowDeepseekApiKey(!showDeepseekApiKey)}
                  >
                    {showDeepseekApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleSaveDeepseekKey}
                  disabled={isLoadingModels}
                  className="bg-[#dcdcde] hover:bg-[#c0c0c2] text-[#161618]"
                >
                  {isLoadingModels && provider === 'deepseek' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#7a7a7c]">
                Get your API key from{' '}
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dcdcde] hover:underline"
                >
                  platform.deepseek.com/api_keys
                </a>
              </p>
            </div>

            {/* OpenAI API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#b0b0b2]">
                OpenAI API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showOpenaiApiKey ? 'text' : 'password'}
                    value={localOpenaiApiKey}
                    onChange={(e) => setLocalOpenaiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="pr-10 bg-[#272729] border-[#3a3a3c] text-[#dcdcde]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowOpenaiApiKey(!showOpenaiApiKey)}
                  >
                    {showOpenaiApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleSaveOpenaiKey}
                  disabled={isLoadingModels}
                  className="bg-[#dcdcde] hover:bg-[#c0c0c2] text-[#161618]"
                >
                  {isLoadingModels && provider === 'openai' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#7a7a7c]">
                Get your API key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dcdcde] hover:underline"
                >
                  platform.openai.com/api-keys
                </a>
              </p>
            </div>

            {/* Anthropic API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#b0b0b2]">
                Anthropic API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showAnthropicApiKey ? 'text' : 'password'}
                    value={localAnthropicApiKey}
                    onChange={(e) => setLocalAnthropicApiKey(e.target.value)}
                    placeholder="sk-ant-..."
                    className="pr-10 bg-[#272729] border-[#3a3a3c] text-[#dcdcde]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowAnthropicApiKey(!showAnthropicApiKey)}
                  >
                    {showAnthropicApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleSaveAnthropicKey}
                  disabled={isLoadingModels}
                  className="bg-[#dcdcde] hover:bg-[#c0c0c2] text-[#161618]"
                >
                  {isLoadingModels && provider === 'anthropic' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#7a7a7c]">
                Get your API key from{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dcdcde] hover:underline"
                >
                  console.anthropic.com/settings/keys
                </a>
              </p>
            </div>

            {/* Z.ai API Key */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-[#b0b0b2]">
                Z.ai API Key
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showZaiApiKey ? 'text' : 'password'}
                    value={localZaiApiKey}
                    onChange={(e) => setLocalZaiApiKey(e.target.value)}
                    placeholder="..."
                    className="pr-10 bg-[#272729] border-[#3a3a3c] text-[#dcdcde]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowZaiApiKey(!showZaiApiKey)}
                  >
                    {showZaiApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleSaveZaiKey}
                  disabled={isLoadingModels}
                  className="bg-[#dcdcde] hover:bg-[#c0c0c2] text-[#161618]"
                >
                  {isLoadingModels && provider === 'zai' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
              <p className="text-xs text-[#7a7a7c]">
                Get your API key from{' '}
                <a
                  href="https://z.ai/usercenter/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#dcdcde] hover:underline"
                >
                  z.ai/usercenter/apikeys
                </a>
              </p>
            </div>

            <Separator className="bg-[#3a3a3c]" />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClearSettings}
                className="flex-1 border-[#3a3a3c] hover:bg-[#272729] text-[#dcdcde]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              {activeKey && (
                <Button
                  variant="outline"
                  onClick={handleRefreshModels}
                  disabled={isLoadingModels}
                  className="border-[#3a3a3c] hover:bg-[#272729] text-[#dcdcde]"
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
