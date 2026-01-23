'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
          'hover:bg-[#272729]/50',
          isCurrentFile && 'bg-[#272729] ring-1 ring-[#3a3a3c]'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' && (
          <span className="w-4 h-4 flex items-center justify-center text-[#7a7a7c]">
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
            'text-sm truncate flex-1 text-[#b0b0b2]',
            isModified && 'text-[#dcdcde]',
            isCreated && 'text-[#dcdcde]'
          )}
        >
          {node.name}
        </span>
        {(isModified || isCreated) && (
          <span
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              isModified ? 'bg-[#9a9a9c]' : 'bg-[#dcdcde]'
            )}
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDelete}
        >
          <Trash2 className="w-3 h-3 text-[#7a7a7c] hover:text-red-400" />
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

  return (
    <div className="h-full flex flex-col bg-[#161618]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#272729]">
        <span className="text-xs font-semibold text-[#9a9a9c] uppercase tracking-wider">
          Explorer
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2">
          {fileTree.length === 0 ? (
            <div className="px-4 py-8 text-center text-[#7a7a7c] text-sm">
              <p>No files yet</p>
              <p className="text-xs mt-1">Ask AI to create files for you</p>
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
