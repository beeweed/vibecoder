'use client';

import { Bot, FolderTree, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  activeTab: 'ai' | 'explorer' | 'editor';
  setActiveTab: (tab: 'ai' | 'explorer' | 'editor') => void;
}

export function MobileNav({ activeTab, setActiveTab }: MobileNavProps) {
  const tabs = [
    { id: 'ai' as const, label: 'AI Agent', icon: Bot },
    { id: 'explorer' as const, label: 'Files', icon: FolderTree },
    { id: 'editor' as const, label: 'Editor', icon: Code2 },
  ];

  return (
    <nav className="flex items-center justify-around border-t border-[#272729] bg-[#1e1e20] py-2 px-4 safe-area-pb">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
              isActive
                ? 'text-[#dcdcde] bg-[#272729]'
                : 'text-[#7a7a7c] hover:text-[#b0b0b2]'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
