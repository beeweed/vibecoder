'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { AIPanel } from '@/components/ai-panel/AIPanel';
import { FileExplorer } from '@/components/file-explorer/FileExplorer';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { MobileNav } from '@/components/layout/MobileNav';
import { Toaster } from '@/components/ui/sonner';

function useViewportHeight() {
  const [vh, setVh] = useState<number | null>(null);

  useEffect(() => {
    const updateVh = () => {
      // Get the actual visible viewport height
      const visualViewport = window.visualViewport;
      if (visualViewport) {
        setVh(visualViewport.height);
      } else {
        setVh(window.innerHeight);
      }
    };

    updateVh();
    
    // Listen for viewport changes (keyboard, address bar hide/show)
    window.visualViewport?.addEventListener('resize', updateVh);
    window.addEventListener('resize', updateVh);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', updateVh);
      window.removeEventListener('resize', updateVh);
    };
  }, []);

  return vh;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'ai' | 'explorer' | 'editor'>('ai');
  const vh = useViewportHeight();

  return (
    <div 
      className="flex flex-col bg-[#161618] text-[#dcdcde] overflow-hidden"
      style={{ 
        height: vh ? `${vh}px` : '100dvh',
        minHeight: vh ? `${vh}px` : '100dvh'
      }}
    >
      <Header />
      
      {/* Desktop Layout */}
      <main className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-[350px] min-w-[280px] border-r border-[#272729] flex-shrink-0">
          <AIPanel />
        </div>
        
        <div className="w-[220px] min-w-[180px] border-r border-[#272729] flex-shrink-0">
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
