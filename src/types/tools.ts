export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: 'pending' | 'executing' | 'completed' | 'error';
  result?: ToolResult;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface ReadFileInput {
  path: string;
}

export interface ReadFileOutput {
  content: string;
  truncated: boolean;
  path: string;
  lineCount: number;
  charCount: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required: string[];
  };
}

export const ALLOWED_FILE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.json', '.jsonc',
  '.md', '.mdx', '.markdown',
  '.txt', '.text',
  '.py', '.pyw',
  '.html', '.htm',
  '.css', '.scss', '.sass', '.less',
  '.yaml', '.yml',
  '.xml',
  '.toml',
  '.ini', '.cfg', '.conf',
  '.sh', '.bash', '.zsh',
  '.sql',
  '.graphql', '.gql',
  '.prisma',
  '.env.example', '.env.local.example', '.env.development.example',
  '.gitignore', '.dockerignore', '.npmignore',
  '.editorconfig',
  '.prettierrc', '.eslintrc',
  'Dockerfile', 'Makefile', 'Procfile',
  '.vue', '.svelte',
  '.astro',
  '.rs', '.go', '.java', '.kt', '.rb', '.php', '.c', '.cpp', '.h', '.hpp',
  '.swift', '.scala', '.clj', '.ex', '.exs', '.erl', '.hs', '.lua', '.r', '.R',
];

export const MAX_FILE_SIZE_BYTES = 100 * 1024; // 100KB
export const MAX_FILE_LINES = 2000;

export const READ_FILE_TOOL: ToolDefinition = {
  name: 'read_file',
  description: 'Reads a file from the project filesystem and returns its content. Use this tool when you need to access real file data - never guess or fabricate file contents. The file content will be injected into your context for reasoning and code generation.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Relative path from project root to the file (e.g., "src/components/Button.tsx")'
      }
    },
    required: ['path']
  }
};
