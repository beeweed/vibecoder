import {
  FileCode,
  FileJson,
  FileText,
  File,
  Folder,
  FolderOpen,
  FileType,
  Palette,
  Settings,
  Image,
  FileCode2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FileIconInfo {
  icon: LucideIcon;
  color: string;
}

const extensionMap: Record<string, FileIconInfo> = {
  ts: { icon: FileCode, color: '#3178c6' },
  tsx: { icon: FileCode, color: '#3178c6' },
  js: { icon: FileCode2, color: '#f7df1e' },
  jsx: { icon: FileCode2, color: '#61dafb' },
  
  css: { icon: Palette, color: '#1572b6' },
  scss: { icon: Palette, color: '#cc6699' },
  sass: { icon: Palette, color: '#cc6699' },
  less: { icon: Palette, color: '#1d365d' },
  
  json: { icon: FileJson, color: '#cbcb41' },
  yaml: { icon: Settings, color: '#cb171e' },
  yml: { icon: Settings, color: '#cb171e' },
  toml: { icon: Settings, color: '#9c4121' },
  
  md: { icon: FileText, color: '#ffffff' },
  mdx: { icon: FileText, color: '#f9ac00' },
  txt: { icon: FileText, color: '#9ca3af' },
  
  html: { icon: FileType, color: '#e34f26' },
  svg: { icon: Image, color: '#ffb13b' },
  
  png: { icon: Image, color: '#a074c4' },
  jpg: { icon: Image, color: '#a074c4' },
  jpeg: { icon: Image, color: '#a074c4' },
  gif: { icon: Image, color: '#a074c4' },
  webp: { icon: Image, color: '#a074c4' },

  py: { icon: FileCode, color: '#3776ab' },
  go: { icon: FileCode, color: '#00add8' },
  rs: { icon: FileCode, color: '#dea584' },
  rb: { icon: FileCode, color: '#cc342d' },
  php: { icon: FileCode, color: '#777bb4' },
  java: { icon: FileCode, color: '#b07219' },
  c: { icon: FileCode, color: '#555555' },
  cpp: { icon: FileCode, color: '#f34b7d' },
  h: { icon: FileCode, color: '#555555' },
  
  sh: { icon: FileCode, color: '#89e051' },
  bash: { icon: FileCode, color: '#89e051' },
  zsh: { icon: FileCode, color: '#89e051' },
  
  sql: { icon: FileCode, color: '#e38c00' },
  prisma: { icon: FileCode, color: '#2d3748' },
  graphql: { icon: FileCode, color: '#e535ab' },
  gql: { icon: FileCode, color: '#e535ab' },
  
  env: { icon: Settings, color: '#ecd53f' },
  gitignore: { icon: Settings, color: '#f14e32' },
  dockerfile: { icon: Settings, color: '#2496ed' },
};

const defaultIcon: FileIconInfo = { icon: File, color: '#9ca3af' };

export function getFileIcon(extension: string): FileIconInfo {
  return extensionMap[extension.toLowerCase()] || defaultIcon;
}

export function getFolderIcon(expanded: boolean): LucideIcon {
  return expanded ? FolderOpen : Folder;
}
