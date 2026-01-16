export interface VirtualFile {
  id: string;
  name: string;
  path: string;
  content: string;
  type: 'file';
  extension: string;
  createdAt: Date;
  modifiedAt: Date;
  lastOperation: 'created' | 'modified' | 'none';
}

export interface VirtualFolder {
  id: string;
  name: string;
  path: string;
  type: 'folder';
  children: string[];
  expanded: boolean;
  createdAt: Date;
}

export type VirtualNode = VirtualFile | VirtualFolder;

export interface FileSystemState {
  nodes: Record<string, VirtualNode>;
  rootChildren: string[];
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  expanded?: boolean;
  extension?: string;
  lastOperation?: 'created' | 'modified' | 'none';
}
