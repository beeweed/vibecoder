'use client';

import { Header } from '@/components/layout/Header';
import { AIPanel } from '@/components/ai-panel/AIPanel';
import { FileExplorer } from '@/components/file-explorer/FileExplorer';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { Toaster } from '@/components/ui/sonner';

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      <Header />
      
      <main className="flex-1 flex overflow-hidden">
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
      
      <SettingsModal />
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
