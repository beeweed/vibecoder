import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { VirtualFile, VirtualFolder, VirtualNode, FileTreeNode } from '@/types/files';

interface FileSystemStore {
  nodes: Record<string, VirtualNode>;
  rootChildren: string[];

  createFile: (path: string, content: string) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  createFolder: (path: string) => void;
  deleteFolder: (path: string) => void;
  renameNode: (path: string, newName: string) => void;
  toggleFolder: (id: string) => void;
  getFileByPath: (path: string) => VirtualFile | null;
  getNodeByPath: (path: string) => VirtualNode | null;
  getAllFiles: () => VirtualFile[];
  getFileTree: () => FileTreeNode[];
  clearFileSystem: () => void;
  clearLastOperations: () => void;
}

const getExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
};

const getFileName = (path: string): string => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};

const getParentPath = (path: string): string | null => {
  const parts = path.split('/');
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('/');
};

export const useFileSystemStore = create<FileSystemStore>((set, get) => ({
  nodes: {},
  rootChildren: [],

  createFile: (path: string, content: string) => {
    const state = get();
    const existingNode = state.getNodeByPath(path);
    
    if (existingNode && existingNode.type === 'file') {
      get().updateFile(path, content);
      return;
    }

    const parentPath = getParentPath(path);
    if (parentPath) {
      const parentNode = state.getNodeByPath(parentPath);
      if (!parentNode) {
        get().createFolder(parentPath);
      }
    }

    const id = uuidv4();
    const name = getFileName(path);
    const now = new Date();

    const newFile: VirtualFile = {
      id,
      name,
      path,
      content,
      type: 'file',
      extension: getExtension(name),
      createdAt: now,
      modifiedAt: now,
      lastOperation: 'created',
    };

    set((state) => {
      const newNodes = { ...state.nodes, [id]: newFile };
      let newRootChildren = [...state.rootChildren];

      if (parentPath) {
        const parentNode = Object.values(newNodes).find(
          (n) => n.path === parentPath && n.type === 'folder'
        ) as VirtualFolder | undefined;

        if (parentNode) {
          newNodes[parentNode.id] = {
            ...parentNode,
            children: [...parentNode.children, id],
          };
        }
      } else {
        newRootChildren = [...newRootChildren, id];
      }

      return { nodes: newNodes, rootChildren: newRootChildren };
    });
  },

  updateFile: (path: string, content: string) => {
    set((state) => {
      const node = Object.values(state.nodes).find(
        (n) => n.path === path && n.type === 'file'
      ) as VirtualFile | undefined;

      if (!node) return state;

      return {
        nodes: {
          ...state.nodes,
          [node.id]: {
            ...node,
            content,
            modifiedAt: new Date(),
            lastOperation: 'modified' as const,
          },
        },
      };
    });
  },

  deleteFile: (path: string) => {
    set((state) => {
      const node = Object.values(state.nodes).find(
        (n) => n.path === path && n.type === 'file'
      );

      if (!node) return state;

      const newNodes = { ...state.nodes };
      delete newNodes[node.id];

      const parentPath = getParentPath(path);
      if (parentPath) {
        const parentNode = Object.values(newNodes).find(
          (n) => n.path === parentPath && n.type === 'folder'
        ) as VirtualFolder | undefined;

        if (parentNode) {
          newNodes[parentNode.id] = {
            ...parentNode,
            children: parentNode.children.filter((c) => c !== node.id),
          };
        }
      }

      return {
        nodes: newNodes,
        rootChildren: state.rootChildren.filter((c) => c !== node.id),
      };
    });
  },

  createFolder: (path: string) => {
    const state = get();
    const existingNode = state.getNodeByPath(path);
    if (existingNode) return;

    const parentPath = getParentPath(path);
    if (parentPath) {
      const parentNode = state.getNodeByPath(parentPath);
      if (!parentNode) {
        get().createFolder(parentPath);
      }
    }

    const id = uuidv4();
    const name = getFileName(path);

    const newFolder: VirtualFolder = {
      id,
      name,
      path,
      type: 'folder',
      children: [],
      expanded: true,
      createdAt: new Date(),
    };

    set((state) => {
      const newNodes = { ...state.nodes, [id]: newFolder };
      let newRootChildren = [...state.rootChildren];

      if (parentPath) {
        const parentNode = Object.values(newNodes).find(
          (n) => n.path === parentPath && n.type === 'folder'
        ) as VirtualFolder | undefined;

        if (parentNode) {
          newNodes[parentNode.id] = {
            ...parentNode,
            children: [...parentNode.children, id],
          };
        }
      } else {
        newRootChildren = [...newRootChildren, id];
      }

      return { nodes: newNodes, rootChildren: newRootChildren };
    });
  },

  deleteFolder: (path: string) => {
    set((state) => {
      const node = Object.values(state.nodes).find(
        (n) => n.path === path && n.type === 'folder'
      ) as VirtualFolder | undefined;

      if (!node) return state;

      const nodesToDelete: string[] = [node.id];
      const collectChildren = (folderId: string) => {
        const folder = state.nodes[folderId] as VirtualFolder;
        if (!folder) return;
        for (const childId of folder.children) {
          nodesToDelete.push(childId);
          const child = state.nodes[childId];
          if (child?.type === 'folder') {
            collectChildren(childId);
          }
        }
      };
      collectChildren(node.id);

      const newNodes = { ...state.nodes };
      for (const id of nodesToDelete) {
        delete newNodes[id];
      }

      const parentPath = getParentPath(path);
      if (parentPath) {
        const parentNode = Object.values(newNodes).find(
          (n) => n.path === parentPath && n.type === 'folder'
        ) as VirtualFolder | undefined;

        if (parentNode) {
          newNodes[parentNode.id] = {
            ...parentNode,
            children: parentNode.children.filter((c) => c !== node.id),
          };
        }
      }

      return {
        nodes: newNodes,
        rootChildren: state.rootChildren.filter((c) => c !== node.id),
      };
    });
  },

  renameNode: (path: string, newName: string) => {
    set((state) => {
      const node = Object.values(state.nodes).find((n) => n.path === path);
      if (!node) return state;

      const parentPath = getParentPath(path);
      const newPath = parentPath ? `${parentPath}/${newName}` : newName;

      if (node.type === 'file') {
        return {
          nodes: {
            ...state.nodes,
            [node.id]: {
              ...node,
              name: newName,
              path: newPath,
              extension: getExtension(newName),
              modifiedAt: new Date(),
            },
          },
        };
      }

      return {
        nodes: {
          ...state.nodes,
          [node.id]: {
            ...node,
            name: newName,
            path: newPath,
          },
        },
      };
    });
  },

  toggleFolder: (id: string) => {
    set((state) => {
      const node = state.nodes[id];
      if (!node || node.type !== 'folder') return state;

      return {
        nodes: {
          ...state.nodes,
          [id]: {
            ...node,
            expanded: !node.expanded,
          },
        },
      };
    });
  },

  getFileByPath: (path: string) => {
    const state = get();
    const node = Object.values(state.nodes).find(
      (n) => n.path === path && n.type === 'file'
    );
    return node as VirtualFile | null;
  },

  getNodeByPath: (path: string) => {
    const state = get();
    return Object.values(state.nodes).find((n) => n.path === path) || null;
  },

  getAllFiles: () => {
    const state = get();
    return Object.values(state.nodes).filter(
      (n) => n.type === 'file'
    ) as VirtualFile[];
  },

  getFileTree: () => {
    const state = get();
    
    const buildTree = (childIds: string[]): FileTreeNode[] => {
      return childIds
        .map((id) => {
          const node = state.nodes[id];
          if (!node) return null;

          if (node.type === 'folder') {
            return {
              id: node.id,
              name: node.name,
              path: node.path,
              type: 'folder' as const,
              expanded: node.expanded,
              children: buildTree(node.children),
            };
          }

          return {
            id: node.id,
            name: node.name,
            path: node.path,
            type: 'file' as const,
            extension: node.extension,
            lastOperation: node.lastOperation,
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

    return buildTree(state.rootChildren);
  },

  clearFileSystem: () => {
    set({ nodes: {}, rootChildren: [] });
  },

  clearLastOperations: () => {
    set((state) => {
      const newNodes = { ...state.nodes };
      for (const id of Object.keys(newNodes)) {
        const node = newNodes[id];
        if (node.type === 'file' && node.lastOperation !== 'none') {
          newNodes[id] = { ...node, lastOperation: 'none' };
        }
      }
      return { nodes: newNodes };
    });
  },
}));
