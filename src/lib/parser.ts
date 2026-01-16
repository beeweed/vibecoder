export interface ParsedFileOperation {
  type: 'create' | 'update' | 'delete';
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
}

const FILE_CREATE_REGEX = /<<<FILE_CREATE:\s*(.+?)>>>/;
const FILE_UPDATE_REGEX = /<<<FILE_UPDATE:\s*(.+?)>>>/;
const FILE_DELETE_REGEX = /<<<FILE_DELETE:\s*(.+?)>>>/;
const FILE_END_REGEX = /<<<FILE_END>>>/;

export function createParser(): ParserState {
  return {
    buffer: '',
    currentOperation: null,
    completedOperations: [],
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
  };
  const newOperations: ParsedFileOperation[] = [];
  let displayText = '';

  while (true) {
    const createMatch = newState.buffer.match(FILE_CREATE_REGEX);
    if (createMatch && !newState.currentOperation && createMatch.index !== undefined) {
      const path = createMatch[1].trim();
      displayText += newState.buffer.slice(0, createMatch.index);
      newState.currentOperation = { type: 'create', path, content: '' };
      newState.buffer = newState.buffer.slice(
        createMatch.index + createMatch[0].length
      );
      continue;
    }

    const updateMatch = newState.buffer.match(FILE_UPDATE_REGEX);
    if (updateMatch && !newState.currentOperation && updateMatch.index !== undefined) {
      const path = updateMatch[1].trim();
      displayText += newState.buffer.slice(0, updateMatch.index);
      newState.currentOperation = { type: 'update', path, content: '' };
      newState.buffer = newState.buffer.slice(
        updateMatch.index + updateMatch[0].length
      );
      continue;
    }

    const deleteMatch = newState.buffer.match(FILE_DELETE_REGEX);
    if (deleteMatch && !newState.currentOperation && deleteMatch.index !== undefined) {
      const path = deleteMatch[1].trim();
      displayText += newState.buffer.slice(0, deleteMatch.index);
      newOperations.push({ type: 'delete', path });
      newState.buffer = newState.buffer.slice(
        deleteMatch.index + deleteMatch[0].length
      );
      continue;
    }

    const endMatch = newState.buffer.match(FILE_END_REGEX);
    if (endMatch && newState.currentOperation && endMatch.index !== undefined) {
      const contentEndIndex = endMatch.index;
      newState.currentOperation.content += newState.buffer.slice(
        0,
        contentEndIndex
      );

      newOperations.push({
        type: newState.currentOperation.type,
        path: newState.currentOperation.path,
        content: cleanContent(newState.currentOperation.content),
      });

      newState.buffer = newState.buffer.slice(
        contentEndIndex + endMatch[0].length
      );
      newState.currentOperation = null;
      continue;
    }

    if (newState.currentOperation) {
      const safeLength = Math.max(0, newState.buffer.length - 50);
      newState.currentOperation.content += newState.buffer.slice(0, safeLength);
      newState.buffer = newState.buffer.slice(safeLength);
    } else {
      const safeLength = Math.max(0, newState.buffer.length - 50);
      displayText += newState.buffer.slice(0, safeLength);
      newState.buffer = newState.buffer.slice(safeLength);
    }

    break;
  }

  return {
    state: newState,
    newOperations,
    displayText,
    currentFilePath: newState.currentOperation?.path || null,
  };
}

export function flushParser(state: ParserState): {
  displayText: string;
  incompleteOperation: ParsedFileOperation | null;
} {
  if (state.currentOperation) {
    console.warn(
      `Incomplete file operation: ${state.currentOperation.type} ${state.currentOperation.path}`
    );
    return {
      displayText: '',
      incompleteOperation: {
        type: state.currentOperation.type,
        path: state.currentOperation.path,
        content: cleanContent(state.currentOperation.content + state.buffer),
      },
    };
  }

  return {
    displayText: state.buffer,
    incompleteOperation: null,
  };
}

function cleanContent(content: string): string {
  let cleaned = content.trim();
  
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    if (firstNewline !== -1) {
      cleaned = cleaned.slice(firstNewline + 1);
    }
  }
  
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  
  return cleaned.trim();
}
