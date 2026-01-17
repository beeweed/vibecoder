'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { AIPanel } from '@/components/ai-panel/AIPanel';
import { FileExplorer } from '@/components/file-explorer/FileExplorer';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { MobileNav } from '@/components/layout/MobileNav';
import { Toaster } from '@/components/ui/sonner';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'ai' | 'explorer' | 'editor'>('ai');

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden safe-area-pt">
      <Header />
      
      {/* Desktop Layout */}
      <main className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-[350px] min-w-[280px] border-r border-zinc-800 flex-shrink-0">
          <AIPanel />
        </div>
        
        <div className="w-[220px] min-w-[180px] border-r border-zinc-800 flex-shrink-0">
          <FileExplorer />
        </div>
        
        <div className="flex-1 min-w-0">
          <EditorPanel />
        </div>
      </main>
      
      {/* Mobile Layout */}
      <main className="flex md:hidden flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {activeTab === 'ai' && <AIPanel />}
          {activeTab === 'explorer' && <FileExplorer />}
          {activeTab === 'editor' && <EditorPanel />}
        </div>
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>
      
      <SettingsModal />
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
