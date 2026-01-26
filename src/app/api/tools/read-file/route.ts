import { type NextRequest, NextResponse } from 'next/server';
import {
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_LINES,
  type ReadFileOutput,
} from '@/types/tools';

function isAllowedFileType(path: string): boolean {
  const normalizedPath = path.toLowerCase();
  
  // Check for common config files without extensions
  const configFiles = ['dockerfile', 'makefile', 'procfile', '.gitignore', '.dockerignore', '.npmignore', '.editorconfig'];
  const fileName = normalizedPath.split('/').pop() || '';
  
  if (configFiles.includes(fileName)) {
    return true;
  }
  
  // Check file extension
  for (const ext of ALLOWED_FILE_EXTENSIONS) {
    if (normalizedPath.endsWith(ext.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

function sanitizePath(path: string): string {
  // Remove leading slashes and dots
  let sanitized = path.replace(/^[./\\]+/, '');
  
  // Normalize path separators
  sanitized = sanitized.replace(/\\/g, '/');
  
  // Remove any path traversal attempts
  sanitized = sanitized.replace(/\.\./g, '');
  
  // Remove multiple consecutive slashes
  sanitized = sanitized.replace(/\/+/g, '/');
  
  return sanitized.trim();
}

function isValidPath(path: string): { valid: boolean; error?: string } {
  // Check for empty path
  if (!path || path.trim() === '') {
    return { valid: false, error: 'Path cannot be empty' };
  }
  
  // Check for path traversal attempts
  if (path.includes('..')) {
    return { valid: false, error: 'Path traversal is not allowed' };
  }
  
  // Check for absolute paths
  if (path.startsWith('/') || /^[A-Za-z]:/.test(path)) {
    return { valid: false, error: 'Absolute paths are not allowed. Use relative paths from project root.' };
  }
  
  // Check for hidden system files (allow .gitignore, .env.example, etc.)
  const fileName = path.split('/').pop() || '';
  const dangerousPatterns = ['.env', '.env.local', '.env.production', '.env.development'];
  if (dangerousPatterns.some(pattern => fileName === pattern)) {
    return { valid: false, error: 'Reading environment files with secrets is not allowed' };
  }
  
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, fileContent } = body;
    
    // Validate path
    const pathValidation = isValidPath(path);
    if (!pathValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: pathValidation.error 
        },
        { status: 400 }
      );
    }
    
    // Sanitize path
    const sanitizedPath = sanitizePath(path);
    
    // Check file type
    if (!isAllowedFileType(sanitizedPath)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "File type not allowed. Only text-based files are supported." 
        },
        { status: 400 }
      );
    }
    
    // For virtual file system, the content is passed from the client
    // In a real implementation, this would read from disk
    if (fileContent === undefined || fileContent === null) {
      return NextResponse.json(
        { 
          success: false, 
          error: `File not found: ${sanitizedPath}` 
        },
        { status: 404 }
      );
    }
    
    let content = String(fileContent);
    let truncated = false;
    
    // Check file size
    const byteSize = new TextEncoder().encode(content).length;
    if (byteSize > MAX_FILE_SIZE_BYTES) {
      // Truncate content
      const maxChars = Math.floor(MAX_FILE_SIZE_BYTES * 0.9); // Account for multi-byte chars
      content = content.slice(0, maxChars);
      content += '\n\n[... FILE TRUNCATED - Content exceeds 100KB limit ...]';
      truncated = true;
    }
    
    // Check line count
    const lines = content.split('\n');
    if (lines.length > MAX_FILE_LINES) {
      content = lines.slice(0, MAX_FILE_LINES).join('\n');
      content += `\n\n[... FILE TRUNCATED - Content exceeds ${MAX_FILE_LINES} lines ...]`;
      truncated = true;
    }
    
    const output: ReadFileOutput = {
      content,
      truncated,
      path: sanitizedPath,
      lineCount: content.split('\n').length,
      charCount: content.length,
    };
    
    return NextResponse.json({
      success: true,
      data: output,
    });
    
  } catch (error) {
    console.error('Read file tool error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to read file' 
      },
      { status: 500 }
    );
  }
}
