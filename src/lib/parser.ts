export interface ParsedFileOperation {
  type: 'create' | 'update' | 'delete' | 'read';
  path: string;
  content?: string;
}

export interface ParserState {
  buffer: string;
  currentOperation: {
    type: 'create' | 'update' | 'delete';
    path: string;
    content: string;
  } | null;
  completedOperations: ParsedFileOperation[];
  insideCodeBlock: boolean;
}

// Patterns for file operations - using more flexible matching
const FILE_CREATE_PATTERN = /<<<\s*FILE_CREATE\s*:\s*([^>]+?)>>>|```\s*(?:tsx?|jsx?|[a-z]+)?\s*\n?\s*\/\/\s*FILE:\s*CREATE\s+([^\n]+)/i;
const FILE_UPDATE_PATTERN = /<<<\s*FILE_UPDATE\s*:\s*([^>]+?)>>>|```\s*(?:tsx?|jsx?|[a-z]+)?\s*\n?\s*\/\/\s*FILE:\s*UPDATE\s+([^\n]+)/i;
const FILE_DELETE_PATTERN = /<<<\s*FILE_DELETE\s*:\s*([^>]+?)>>>/i;
const FILE_READ_PATTERN = /<<<\s*FILE_READ\s*:\s*([^>]+?)>>>/i;
const FILE_END_PATTERN = /<<<\s*FILE_END\s*>>>|```\s*$/;

// Detect partial markers that might be forming
const PARTIAL_MARKER_PATTERN = /<{1,3}$|<{1,3}F|<{1,3}FI|<<<\s*FILE|<<<\s*FILE_|<<<\s*FILE_[A-Z]+|<<<\s*FILE_[A-Z]+\s*:|<<<\s*FILE_[A-Z]+\s*:\s*[^>]*$/i;

export function createParser(): ParserState {
  return {
    buffer: '',
    currentOperation: null,
    completedOperations: [],
    insideCodeBlock: false,
  };
}

export function parseChunk(
  state: ParserState,
  chunk: string
): {
  state: ParserState;
  newOperations: ParsedFileOperation[];
  displayText: string;
  currentFilePath: string | null;
} {
  const newState: ParserState = {
    buffer: state.buffer + chunk,
    currentOperation: state.currentOperation
      ? { ...state.currentOperation }
      : null,
    completedOperations: [...state.completedOperations],
    insideCodeBlock: state.insideCodeBlock,
  };
  const newOperations: ParsedFileOperation[] = [];
  let displayText = '';

  let iterations = 0;
  const maxIterations = 100;

  while (iterations < maxIterations) {
    iterations++;
    let matched = false;

    // Check for FILE_CREATE marker
    const createMatch = newState.buffer.match(FILE_CREATE_PATTERN);
    if (createMatch && !newState.currentOperation) {
      const matchIndex = createMatch.index ?? 0;
      const path = (createMatch[1] || createMatch[2] || '').trim();
      
      if (path) {
        // Get text before the marker (for display) but filter out any partial markers
        const textBefore = newState.buffer.slice(0, matchIndex);
        displayText += filterPartialMarkers(textBefore);
        
        newState.currentOperation = { type: 'create', path, content: '' };
        newState.buffer = newState.buffer.slice(matchIndex + createMatch[0].length);
        matched = true;
        continue;
      }
    }

    // Check for FILE_UPDATE marker
    const updateMatch = newState.buffer.match(FILE_UPDATE_PATTERN);
    if (updateMatch && !newState.currentOperation) {
      const matchIndex = updateMatch.index ?? 0;
      const path = (updateMatch[1] || updateMatch[2] || '').trim();
      
      if (path) {
        const textBefore = newState.buffer.slice(0, matchIndex);
        displayText += filterPartialMarkers(textBefore);
        
        newState.currentOperation = { type: 'update', path, content: '' };
        newState.buffer = newState.buffer.slice(matchIndex + updateMatch[0].length);
        matched = true;
        continue;
      }
    }

    // Check for FILE_DELETE marker
    const deleteMatch = newState.buffer.match(FILE_DELETE_PATTERN);
    if (deleteMatch && !newState.currentOperation) {
      const matchIndex = deleteMatch.index ?? 0;
      const path = (deleteMatch[1] || '').trim();
      
      if (path) {
        const textBefore = newState.buffer.slice(0, matchIndex);
        displayText += filterPartialMarkers(textBefore);
        
        newOperations.push({ type: 'delete', path });
        newState.buffer = newState.buffer.slice(matchIndex + deleteMatch[0].length);
        matched = true;
        continue;
      }
    }

    // Check for FILE_READ marker (tool call)
    const readMatch = newState.buffer.match(FILE_READ_PATTERN);
    if (readMatch && !newState.currentOperation) {
      const matchIndex = readMatch.index ?? 0;
      const path = (readMatch[1] || '').trim();
      
      if (path) {
        const textBefore = newState.buffer.slice(0, matchIndex);
        displayText += filterPartialMarkers(textBefore);
        
        newOperations.push({ type: 'read', path });
        newState.buffer = newState.buffer.slice(matchIndex + readMatch[0].length);
        matched = true;
        continue;
      }
    }

    // Check for FILE_END marker (only when inside an operation)
    if (newState.currentOperation) {
      const endMatch = newState.buffer.match(FILE_END_PATTERN);
      if (endMatch && endMatch.index !== undefined) {
        const contentEndIndex = endMatch.index;
        newState.currentOperation.content += newState.buffer.slice(0, contentEndIndex);

        newOperations.push({
          type: newState.currentOperation.type,
          path: newState.currentOperation.path,
          content: cleanContent(newState.currentOperation.content),
        });

        newState.buffer = newState.buffer.slice(contentEndIndex + endMatch[0].length);
        newState.currentOperation = null;
        matched = true;
        continue;
      }
    }

    if (!matched) {
      // No marker found - handle buffer content
      if (newState.currentOperation) {
        // Inside a file operation - accumulate content, keep buffer for potential END marker
        const bufferKeepLength = 20; // Keep enough to detect <<<FILE_END>>>
        const safeLength = Math.max(0, newState.buffer.length - bufferKeepLength);
        if (safeLength > 0) {
          newState.currentOperation.content += newState.buffer.slice(0, safeLength);
          newState.buffer = newState.buffer.slice(safeLength);
        }
      } else {
        // Not inside a file operation - output to display
        // Keep enough buffer to detect any file marker pattern
        const bufferKeepLength = 30; // Keep enough for <<<FILE_CREATE: path>>>
        
        // Check if buffer ends with a partial marker
        if (PARTIAL_MARKER_PATTERN.test(newState.buffer)) {
          // Don't output anything yet, wait for more data
          break;
        }
        
        const safeLength = Math.max(0, newState.buffer.length - bufferKeepLength);
        if (safeLength > 0) {
          const textToDisplay = newState.buffer.slice(0, safeLength);
          displayText += filterPartialMarkers(textToDisplay);
          newState.buffer = newState.buffer.slice(safeLength);
        }
      }
      break;
    }
  }

  return {
    state: newState,
    newOperations,
    displayText: cleanDisplayText(displayText),
    currentFilePath: newState.currentOperation?.path || null,
  };
}

export function flushParser(state: ParserState): {
  displayText: string;
  incompleteOperation: ParsedFileOperation | null;
} {
  if (state.currentOperation) {
    return {
      displayText: '',
      incompleteOperation: {
        type: state.currentOperation.type,
        path: state.currentOperation.path,
        content: cleanContent(state.currentOperation.content + state.buffer),
      },
    };
  }

  // Clean remaining buffer before displaying
  const cleanedBuffer = filterPartialMarkers(state.buffer);
  return {
    displayText: cleanDisplayText(cleanedBuffer),
    incompleteOperation: null,
  };
}

function cleanContent(content: string): string {
  let cleaned = content.trim();
  
  // Remove opening code fence with optional language
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    if (firstNewline !== -1) {
      cleaned = cleaned.slice(firstNewline + 1);
    } else {
      cleaned = cleaned.slice(3);
    }
  }
  
  // Remove closing code fence
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  
  // Also handle case where there's whitespace before closing fence
  cleaned = cleaned.replace(/\n*```\s*$/, '');
  
  return cleaned.trim();
}

function filterPartialMarkers(text: string): string {
  // Remove any file operation markers that might have leaked through
  let filtered = text;
  
  // Remove complete markers that shouldn't be displayed
  filtered = filtered.replace(/<<<\s*FILE_(?:CREATE|UPDATE|DELETE|READ)\s*:\s*[^>]*>>>/gi, '');
  filtered = filtered.replace(/<<<\s*FILE_END\s*>>>/gi, '');
  
  // Remove partial markers at the end
  filtered = filtered.replace(/<{1,3}(?:\s*FILE)?(?:_[A-Z]*)?(?:\s*:)?(?:\s*[^>]*)?$/i, '');
  
  return filtered;
}

function cleanDisplayText(text: string): string {
  let cleaned = text;
  
  // Remove any remaining file markers
  cleaned = cleaned.replace(/<<<\s*FILE_(?:CREATE|UPDATE|DELETE|READ)\s*:\s*[^>]*>>>/gi, '');
  cleaned = cleaned.replace(/<<<\s*FILE_END\s*>>>/gi, '');
  
  // Remove orphaned code fences that were part of file operations
  cleaned = cleaned.replace(/```(?:tsx?|jsx?|typescript|javascript|python|css|html|json|yaml|markdown|md|sh|bash|sql|prisma|graphql|gql)?\s*\n*$/gi, '');
  
  // Clean up excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned;
}
