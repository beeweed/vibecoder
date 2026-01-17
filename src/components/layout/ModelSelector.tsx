'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OpenRouterModel } from '@/types/openrouter';

interface ModelSelectorProps {
  models: OpenRouterModel[];
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
  isLoading = false,
  disabled = false,
  placeholder = 'Select model',
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter models based on search
  const filteredModels = useMemo(() => {
    if (!search.trim()) return models;
    const searchLower = search.toLowerCase();
    return models.filter(
      (model) =>
        model.name.toLowerCase().includes(searchLower) ||
        model.id.toLowerCase().includes(searchLower)
    );
  }, [models, search]);

  // Get selected model name
  const selectedModelName = useMemo(() => {
    const model = models.find((m) => m.id === selectedModel);
    return model?.name || selectedModel.split('/').pop() || placeholder;
  }, [models, selectedModel, placeholder]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (modelId: string) => {
    onSelectModel(modelId);
    setIsOpen(false);
    setSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center justify-between gap-2 w-[180px] md:w-[280px] h-10 px-3',
          'bg-zinc-900 border border-zinc-700 rounded-md',
          'text-sm text-zinc-100 text-left',
          'hover:bg-zinc-800 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isOpen && 'ring-2 ring-violet-500 border-violet-500'
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="hidden md:inline text-zinc-400">Loading...</span>
          </div>
        ) : (
          <span className="truncate">{selectedModelName}</span>
        )}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-zinc-400 transition-transform flex-shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full right-0 mt-1 z-50',
            'w-[300px] md:w-[400px]',
            'bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl',
            'overflow-hidden'
          )}
          onKeyDown={handleKeyDown}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models..."
                className={cn(
                  'w-full h-9 pl-9 pr-8 bg-zinc-800 border border-zinc-700 rounded-md',
                  'text-sm text-zinc-100 placeholder:text-zinc-500',
                  'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
                )}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-700 rounded"
                >
                  <X className="w-3 h-3 text-zinc-400" />
                </button>
              )}
            </div>
          </div>

          {/* Model List */}
          <div className="max-h-[300px] overflow-y-auto">
            {filteredModels.length > 0 ? (
              <div className="py-1">
                {filteredModels.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelect(model.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left',
                      'hover:bg-zinc-800 transition-colors',
                      selectedModel === model.id && 'bg-violet-500/10'
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                        selectedModel === model.id
                          ? 'bg-violet-500 text-white'
                          : 'border border-zinc-600'
                      )}
                    >
                      {selectedModel === model.id && <Check className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-100 truncate">{model.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{model.id}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-zinc-500">
                  {models.length === 0
                    ? 'No models available. Add API key first.'
                    : 'No models found matching your search.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer with count */}
          {models.length > 0 && (
            <div className="px-3 py-2 border-t border-zinc-800 bg-zinc-900/50">
              <p className="text-xs text-zinc-500">
                {filteredModels.length} of {models.length} models
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
