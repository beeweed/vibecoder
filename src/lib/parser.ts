export interface ParsedFileOperation {
  type: 'create' | 'update' | 'delete' | 'read';
  path: string;
  content?: string;
}

export interface ParsedToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ParserState {
  buffer: string;
  currentOperation: {
    type: 'create' | 'update' | 'delete';
    path: string;
    content: string;
  } | null;
  currentToolCall: {
    name: string;
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

// Tool call patterns
const TOOL_CALL_PATTERN = /<<<\s*TOOL_CALL\s*:\s*([^>]+?)>>>/i;
const TOOL_END_PATTERN = /<<<\s*TOOL_END\s*>>>/i;

// Detect partial markers that might be forming
const PARTIAL_MARKER_PATTERN = /<{1,3}$|<{1,3}F|<{1,3}FI|<{1,3}T|<{1,3}TO|<<<\s*FILE|<<<\s*FILE_|<<<\s*FILE_[A-Z]+|<<<\s*FILE_[A-Z]+\s*:|<<<\s*FILE_[A-Z]+\s*:\s*[^>]*$|<<<\s*TOOL|<<<\s*TOOL_|<<<\s*TOOL_CALL|<<<\s*TOOL_CALL\s*:|<<<\s*TOOL_CALL\s*:\s*[^>]*$/i;

export function createParser(): ParserState {
  return {
    buffer: '',
    currentOperation: null,
    currentToolCall: null,
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
  newToolCalls: ParsedToolCall[];
  displayText: string;
  currentFilePath: string | null;
  currentToolName: string | null;
} {
  const newState: ParserState = {
    buffer: state.buffer + chunk,
    currentOperation: state.currentOperation
      ? { ...state.currentOperation }
      : null,
    currentToolCall: state.currentToolCall
      ? { ...state.currentToolCall }
      : null,
    completedOperations: [...state.completedOperations],
    insideCodeBlock: state.insideCodeBlock,
  };
  const newOperations: ParsedFileOperation[] = [];
  const newToolCalls: ParsedToolCall[] = [];
  let displayText = '';

  let iterations = 0;
  const maxIterations = 100;

  while (iterations < maxIterations) {
    iterations++;
    let matched = false;

    // Check for TOOL_CALL marker
    const toolCallMatch = newState.buffer.match(TOOL_CALL_PATTERN);
    if (toolCallMatch && !newState.currentOperation && !newState.currentToolCall) {
      const matchIndex = toolCallMatch.index ?? 0;
      const toolName = (toolCallMatch[1] || '').trim();
      
      if (toolName) {
        const textBefore = newState.buffer.slice(0, matchIndex);
        displayText += filterPartialMarkers(textBefore);
        
        newState.currentToolCall = { name: toolName, content: '' };
        newState.buffer = newState.buffer.slice(matchIndex + toolCallMatch[0].length);
        matched = true;
        continue;
      }
    }

    // Check for TOOL_END marker (only when inside a tool call)
    if (newState.currentToolCall) {
      const toolEndMatch = newState.buffer.match(TOOL_END_PATTERN);
      if (toolEndMatch && toolEndMatch.index !== undefined) {
        const contentEndIndex = toolEndMatch.index;
        newState.currentToolCall.content += newState.buffer.slice(0, contentEndIndex);

        // Parse the JSON arguments
        try {
          const cleanedContent = newState.currentToolCall.content.trim();
          const args = cleanedContent ? JSON.parse(cleanedContent) : {};
          newToolCalls.push({
            name: newState.currentToolCall.name,
            arguments: args,
          });
        } catch {
          // If JSON parsing fails, try to extract path for read_file
          if (newState.currentToolCall.name === 'read_file') {
            const pathMatch = newState.currentToolCall.content.match(/["']?path["']?\s*:\s*["']([^"']+)["']/);
            if (pathMatch) {
              newToolCalls.push({
                name: 'read_file',
                arguments: { path: pathMatch[1] },
              });
            }
          }
        }

        newState.buffer = newState.buffer.slice(contentEndIndex + toolEndMatch[0].length);
        newState.currentToolCall = null;
        matched = true;
        continue;
      }
    }

    // Check for FILE_CREATE marker
    const createMatch = newState.buffer.match(FILE_CREATE_PATTERN);
    if (createMatch && !newState.currentOperation && !newState.currentToolCall) {
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
    if (updateMatch && !newState.currentOperation && !newState.currentToolCall) {
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
    if (deleteMatch && !newState.currentOperation && !newState.currentToolCall) {
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

    // Check for FILE_READ marker (legacy tool call format)
    const readMatch = newState.buffer.match(FILE_READ_PATTERN);
    if (readMatch && !newState.currentOperation && !newState.currentToolCall) {
      const matchIndex = readMatch.index ?? 0;
      const path = (readMatch[1] || '').trim();
      
      if (path) {
        const textBefore = newState.buffer.slice(0, matchIndex);
        displayText += filterPartialMarkers(textBefore);
        
        // Convert legacy FILE_READ to tool call
        newToolCalls.push({
          name: 'read_file',
          arguments: { path },
        });
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
      } else if (newState.currentToolCall) {
        // Inside a tool call - accumulate content, keep buffer for potential TOOL_END marker
        const bufferKeepLength = 20; // Keep enough to detect <<<TOOL_END>>>
        const safeLength = Math.max(0, newState.buffer.length - bufferKeepLength);
        if (safeLength > 0) {
          newState.currentToolCall.content += newState.buffer.slice(0, safeLength);
          newState.buffer = newState.buffer.slice(safeLength);
        }
      } else {
        // Not inside a file operation or tool call - output to display
        // Keep enough buffer to detect any marker pattern
        const bufferKeepLength = 35; // Keep enough for <<<TOOL_CALL: read_file>>>
        
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
    newToolCalls,
    displayText: cleanDisplayText(displayText),
    currentFilePath: newState.currentOperation?.path || null,
    currentToolName: newState.currentToolCall?.name || null,
  };
}

export function flushParser(state: ParserState): {
  displayText: string;
  incompleteOperation: ParsedFileOperation | null;
  incompleteToolCall: ParsedToolCall | null;
} {
  if (state.currentOperation) {
    return {
      displayText: '',
      incompleteOperation: {
        type: state.currentOperation.type,
        path: state.currentOperation.path,
        content: cleanContent(state.currentOperation.content + state.buffer),
      },
      incompleteToolCall: null,
    };
  }

  if (state.currentToolCall) {
    // Try to parse the incomplete tool call
    try {
      const cleanedContent = (state.currentToolCall.content + state.buffer).trim();
      const args = cleanedContent ? JSON.parse(cleanedContent) : {};
      return {
        displayText: '',
        incompleteOperation: null,
        incompleteToolCall: {
          name: state.currentToolCall.name,
          arguments: args,
        },
      };
    } catch {
      // If parsing fails, return null for the tool call
      return {
        displayText: '',
        incompleteOperation: null,
        incompleteToolCall: null,
      };
    }
  }

  // Clean remaining buffer before displaying
  const cleanedBuffer = filterPartialMarkers(state.buffer);
  return {
    displayText: cleanDisplayText(cleanedBuffer),
    incompleteOperation: null,
    incompleteToolCall: null,
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
  filtered = filtered.replace(/<<<\s*TOOL_CALL\s*:\s*[^>]*>>>/gi, '');
  filtered = filtered.replace(/<<<\s*TOOL_END\s*>>>/gi, '');
  
  // Remove partial markers at the end
  filtered = filtered.replace(/<{1,3}(?:\s*(?:FILE|TOOL))?(?:_[A-Z]*)?(?:\s*:)?(?:\s*[^>]*)?$/i, '');
  
  return filtered;
}

function cleanDisplayText(text: string): string {
  let cleaned = text;
  
  // Remove any remaining file markers
  cleaned = cleaned.replace(/<<<\s*FILE_(?:CREATE|UPDATE|DELETE|READ)\s*:\s*[^>]*>>>/gi, '');
  cleaned = cleaned.replace(/<<<\s*FILE_END\s*>>>/gi, '');
  
  // Remove any remaining tool call markers
  cleaned = cleaned.replace(/<<<\s*TOOL_CALL\s*:\s*[^>]*>>>/gi, '');
  cleaned = cleaned.replace(/<<<\s*TOOL_END\s*>>>/gi, '');
  
  // Remove tool call JSON content that might have leaked
  cleaned = cleaned.replace(/\{"path"\s*:\s*"[^"]*"\}/gi, '');
  
  // Remove orphaned code fences that were part of file operations
  cleaned = cleaned.replace(/```(?:tsx?|jsx?|typescript|javascript|python|css|html|json|yaml|markdown|md|sh|bash|sql|prisma|graphql|gql)?\s*\n*$/gi, '');
  
  // Clean up excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned;
}
