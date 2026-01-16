'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  FolderPlus,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFileSystemStore } from '@/stores/fileSystemStore';
import { useEditorStore } from '@/stores/editorStore';
import { useAgentStore } from '@/stores/agentStore';
import { getFileIcon, getFolderIcon } from '@/lib/fileIcons';
import type { FileTreeNode, VirtualFile, VirtualFolder } from '@/types/files';
import { cn } from '@/lib/utils';

interface FileNodeProps {
  node: FileTreeNode;
  depth: number;
}

function FileNode({ node, depth }: FileNodeProps) {
  const toggleFolder = useFileSystemStore((s) => s.toggleFolder);
  const openFile = useEditorStore((s) => s.openFile);
  const deleteFile = useFileSystemStore((s) => s.deleteFile);
  const deleteFolder = useFileSystemStore((s) => s.deleteFolder);
  const currentFile = useAgentStore((s) => s.currentFile);

  const isCurrentFile = currentFile === node.path;
  const isModified = node.lastOperation === 'modified';
  const isCreated = node.lastOperation === 'created';

  const handleClick = () => {
    if (node.type === 'folder') {
      toggleFolder(node.id);
    } else {
      openFile(node.path, node.name);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'folder') {
      deleteFolder(node.path);
    } else {
      deleteFile(node.path);
    }
  };

  const Icon =
    node.type === 'folder'
      ? getFolderIcon(node.expanded || false)
      : getFileIcon(node.extension || '').icon;

  const iconColor =
    node.type === 'folder'
      ? '#fbbf24'
      : getFileIcon(node.extension || '').color;

  return (
    <div>
      <motion.div
        initial={isCreated ? { opacity: 0, x: -10 } : false}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'group flex items-center gap-1 py-1 px-2 cursor-pointer rounded-md transition-colors',
          'hover:bg-zinc-800/50',
          isCurrentFile && 'bg-violet-500/20 ring-1 ring-violet-500/40'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' && (
          <span className="w-4 h-4 flex items-center justify-center text-zinc-500">
            {node.expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </span>
        )}
        {node.type === 'file' && <span className="w-4" />}
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />
        <span
          className={cn(
            'text-sm truncate flex-1',
            isModified && 'text-yellow-400',
            isCreated && 'text-green-400'
          )}
        >
          {node.name}
        </span>
        {(isModified || isCreated) && (
          <span
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              isModified ? 'bg-yellow-400' : 'bg-green-400'
            )}
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDelete}
        >
          <Trash2 className="w-3 h-3 text-zinc-500 hover:text-red-400" />
        </Button>
      </motion.div>

      <AnimatePresence>
        {node.type === 'folder' && node.expanded && node.children && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            {node.children.map((child) => (
              <FileNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FileExplorer() {
  const nodes = useFileSystemStore((s) => s.nodes);
  const rootChildren = useFileSystemStore((s) => s.rootChildren);
  const createFile = useFileSystemStore((s) => s.createFile);
  const createFolder = useFileSystemStore((s) => s.createFolder);
  const clearFileSystem = useFileSystemStore((s) => s.clearFileSystem);

  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName] = useState('');

  const fileTree = useMemo(() => {
    const buildTree = (childIds: string[]): FileTreeNode[] => {
      return childIds
        .map((id) => {
          const node = nodes[id];
          if (!node) return null;

          if (node.type === 'folder') {
            const folder = node as VirtualFolder;
            return {
              id: folder.id,
              name: folder.name,
              path: folder.path,
              type: 'folder' as const,
              expanded: folder.expanded,
              children: buildTree(folder.children),
            };
          }

          const file = node as VirtualFile;
          return {
            id: file.id,
            name: file.name,
            path: file.path,
            type: 'file' as const,
            extension: file.extension,
            lastOperation: file.lastOperation,
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (!a || !b) return 0;
          if (a.type === 'folder' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name);
        }) as FileTreeNode[];
    };

    return buildTree(rootChildren);
  }, [nodes, rootChildren]);

  const handleCreate = () => {
    if (!newName.trim()) {
      setIsCreating(null);
      return;
    }

    if (isCreating === 'file') {
      createFile(newName.trim(), '');
    } else if (isCreating === 'folder') {
      createFolder(newName.trim());
    }

    setNewName('');
    setIsCreating(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      setIsCreating(null);
      setNewName('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-6 h-6">
                <Plus className="w-4 h-4 text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
              <DropdownMenuItem
                onClick={() => setIsCreating('file')}
                className="focus:bg-zinc-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                New File
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsCreating('folder')}
                className="focus:bg-zinc-800"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="w-6 h-6"
            onClick={clearFileSystem}
            title="Clear all files"
          >
            <RefreshCw className="w-4 h-4 text-zinc-400" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2">
          {isCreating && (
            <div className="px-3 py-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleCreate}
                placeholder={isCreating === 'file' ? 'filename.ts' : 'folder-name'}
                className="h-7 text-sm bg-zinc-800 border-zinc-700"
                autoFocus
              />
            </div>
          )}

          {fileTree.length === 0 && !isCreating ? (
            <div className="px-4 py-8 text-center text-zinc-500 text-sm">
              <p>No files yet</p>
              <p className="text-xs mt-1">Start coding to create files</p>
            </div>
          ) : (
            fileTree.map((node) => (
              <FileNode key={node.id} node={node} depth={0} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
