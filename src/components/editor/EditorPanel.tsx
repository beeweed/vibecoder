'use client';

import { useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { X, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useEditorStore } from '@/stores/editorStore';
import { useFileSystemStore } from '@/stores/fileSystemStore';
import { cn } from '@/lib/utils';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { ssr: false }
);

const languageMap: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  json: 'json',
  md: 'markdown',
  mdx: 'markdown',
  css: 'css',
  scss: 'scss',
  html: 'html',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  py: 'python',
  go: 'go',
  rs: 'rust',
  sql: 'sql',
  sh: 'shell',
  bash: 'shell',
  dockerfile: 'dockerfile',
  env: 'plaintext',
  txt: 'plaintext',
  prisma: 'prisma',
  graphql: 'graphql',
  gql: 'graphql',
};

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return languageMap[ext] || 'plaintext';
}

export function EditorPanel() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const closeTab = useEditorStore((s) => s.closeTab);
  const setCursorPosition = useEditorStore((s) => s.setCursorPosition);

  const getFileByPath = useFileSystemStore((s) => s.getFileByPath);
  const updateFile = useFileSystemStore((s) => s.updateFile);

  const editorRef = useRef<unknown>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const activeFile = activeTab ? getFileByPath(activeTab.filePath) : null;

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeTab && value !== undefined) {
        updateFile(activeTab.filePath, value);
      }
    },
    [activeTab, updateFile]
  );

  const handleEditorMount = useCallback((editor: unknown) => {
    editorRef.current = editor;
    const typedEditor = editor as {
      onDidChangeCursorPosition: (callback: (e: { position: { lineNumber: number; column: number } }) => void) => void;
    };
    typedEditor.onDidChangeCursorPosition((e) => {
      setCursorPosition(e.position.lineNumber, e.position.column);
    });
  }, [setCursorPosition]);

  useEffect(() => {
    if (editorRef.current && activeFile) {
      const editor = editorRef.current as {
        getModel: () => { getValue: () => string } | null;
        setValue: (value: string) => void;
      };
      const model = editor.getModel();
      if (model && model.getValue() !== activeFile.content) {
        editor.setValue(activeFile.content);
      }
    }
  }, [activeFile]);

  if (tabs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-500">
        <Code2 className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No file open</p>
        <p className="text-sm mt-1">Select a file from the explorer or ask AI to create one</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <ScrollArea className="border-b border-zinc-800">
        <div className="flex">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                'group flex items-center gap-2 px-4 py-2 cursor-pointer border-r border-zinc-800 transition-colors',
                activeTabId === tab.id
                  ? 'bg-zinc-900 text-zinc-100'
                  : 'bg-zinc-950 text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'
              )}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="text-sm truncate max-w-[120px]">
                {tab.fileName}
              </span>
              {tab.isModified && (
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex-1 overflow-hidden">
        {activeTab && (
          <MonacoEditor
            height="100%"
            language={getLanguage(activeTab.fileName)}
            value={activeFile?.content || ''}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
              lineNumbers: 'on',
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              tabSize: 2,
              padding: { top: 16 },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'all',
              bracketPairColorization: { enabled: true },
            }}
          />
        )}
      </div>

      <div className="h-6 border-t border-zinc-800 flex items-center justify-between px-4 text-xs text-zinc-500 bg-zinc-900">
        <span>{activeTab ? getLanguage(activeTab.fileName) : ''}</span>
        <span>
          Ln{' '}
          {useEditorStore.getState().cursorPosition.line}, Col{' '}
          {useEditorStore.getState().cursorPosition.column}
        </span>
      </div>
    </div>
  );
}
