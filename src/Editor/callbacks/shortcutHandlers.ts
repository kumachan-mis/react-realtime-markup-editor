import { insertText, resetSuggestion, resetTextSelectionAndSuggestion } from './utils';

import { State, ShortcutCommand } from '../types';
import { moveCursor, cursorCoordinateToTextIndex, coordinatesAreEqual } from '../../Cursor/utils';
import { getSelectedText } from '../../Selection/utils';
import { TextLinesConstants } from '../../TextLines/constants';

export function handleOnShortcut(
  command: ShortcutCommand | undefined,
  text: string,
  state: State,
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  switch (command) {
    case 'forwardDelete':
      return handleOnForwardDelete(text, state, event);
    case 'backwardDelete':
      return handleOnBackwardDelete(text, state, event);
    case 'selectAll':
      return handleOnSelectAll(text, state, event);
    case 'undo':
      return handleOnUndo(text, state, event);
    case 'redo':
      return handleOnRedo(text, state, event);
    case 'moveUp':
      return handleOnMoveUp(text, state, event);
    case 'moveDown':
      return handleOnMoveDown(text, state, event);
    case 'moveLeft':
      return handleOnMoveLeft(text, state, event);
    case 'moveRight':
      return handleOnMoveRight(text, state, event);
    case 'moveWordTop':
      return handleOnMoveWordTop(text, state, event);
    case 'moveWordBottom':
      return handleOnMoveWordBottom(text, state, event);
    case 'moveLineTop':
      return handleOnMoveLineTop(text, state, event);
    case 'moveLineBottom':
      return handleOnMoveLineBottom(text, state, event);
    case 'moveTextTop':
      return handleOnMoveTextTop(text, state, event);
    case 'moveTextBottom':
      return handleOnMoveTextBottom(text, state, event);
    default:
      return [text, state];
  }
}

export function handleOnForwardDelete(
  text: string,
  state: State,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];
  if (state.textSelection) return insertText(text, state, '');

  const current = state.cursorCoordinate;
  const forward = moveCursor(text, current, 1);
  return insertText(text, { ...state, textSelection: { fixed: current, free: forward } }, '');
}

export function handleOnBackwardDelete(
  text: string,
  state: State,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];
  if (state.textSelection) return insertText(text, state, '');

  const current = state.cursorCoordinate;
  const backward = moveCursor(text, current, -1);
  const forward = moveCursor(text, current, 1);
  const neighborText = getSelectedText(text, { fixed: backward, free: forward });
  switch (neighborText) {
    case '[]':
    case '{}':
    case '()':
      return insertText(text, { ...state, textSelection: { fixed: backward, free: forward } }, '');
    default:
      return insertText(text, { ...state, textSelection: { fixed: backward, free: current } }, '');
  }
}

export function handleOnSelectAll(
  text: string,
  state: State,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];
  const lines = text.split('\n');
  const textSelection = {
    fixed: { lineIndex: 0, charIndex: 0 },
    free: { lineIndex: lines.length - 1, charIndex: lines[lines.length - 1].length },
  };
  return [text, resetSuggestion({ ...state, textSelection })];
}

export function handleOnUndo(
  text: string,
  state: State,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  const { editActionHistory, historyHead } = state;
  if (historyHead == -1 || state.textAreaValue != '') return [text, state];

  const action = editActionHistory[historyHead];
  switch (action.actionType) {
    case 'insert': {
      const startIndex = cursorCoordinateToTextIndex(text, action.coordinate);
      const endIndex = startIndex + action.text.length;
      const newText = text.substring(0, startIndex) + text.substring(endIndex);
      const newState = resetTextSelectionAndSuggestion({
        ...state,
        cursorCoordinate: action.coordinate,
        historyHead: historyHead - 1,
      });
      return [newText, newState];
    }
    case 'delete': {
      const insertIndex = cursorCoordinateToTextIndex(text, action.coordinate);
      const newText = text.substring(0, insertIndex) + action.text + text.substring(insertIndex);
      const newState = resetTextSelectionAndSuggestion({
        ...state,
        cursorCoordinate: moveCursor(newText, action.coordinate, action.text.length),
        historyHead: historyHead - 1,
      });
      return [newText, newState];
    }
  }
}

export function handleOnRedo(
  text: string,
  state: State,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  const { editActionHistory, historyHead } = state;
  if (historyHead == editActionHistory.length - 1 || state.textAreaValue != '') {
    return [text, state];
  }

  const action = editActionHistory[historyHead + 1];
  switch (action.actionType) {
    case 'insert': {
      const insertIndex = cursorCoordinateToTextIndex(text, action.coordinate);
      const newText = text.substring(0, insertIndex) + action.text + text.substring(insertIndex);
      const newState = resetTextSelectionAndSuggestion({
        ...state,
        cursorCoordinate: moveCursor(newText, action.coordinate, action.text.length),
        historyHead: historyHead + 1,
      });
      return [newText, newState];
    }
    case 'delete': {
      const startIndex = cursorCoordinateToTextIndex(text, action.coordinate);
      const endIndex = startIndex + action.text.length;
      const newText = text.substring(0, startIndex) + text.substring(endIndex);
      const newState = resetTextSelectionAndSuggestion({
        ...state,
        cursorCoordinate: action.coordinate,
        historyHead: historyHead + 1,
      });
      return [newText, newState];
    }
  }
}

export function handleOnMoveUp(
  text: string,
  state: State,
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];

  const lines = text.split('\n');
  const prevLine = lines[state.cursorCoordinate.lineIndex - 1];
  if (prevLine === undefined) return [text, state];

  const cursorCoordinate = {
    lineIndex: state.cursorCoordinate.lineIndex - 1,
    charIndex: Math.min(state.cursorCoordinate.charIndex, prevLine.length),
  };
  const textSelection = (() => {
    if (!event.shiftKey) return undefined;
    const fixed = state.textSelection ? state.textSelection.fixed : state.cursorCoordinate;
    const free = { ...cursorCoordinate };
    return !coordinatesAreEqual(fixed, free) ? { fixed, free } : undefined;
  })();
  return [text, { ...state, cursorCoordinate, textSelection }];
}

export function handleOnMoveDown(
  text: string,
  state: State,
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];

  const lines = text.split('\n');
  const nextLine = lines[state.cursorCoordinate.lineIndex + 1];
  if (nextLine === undefined) return [text, state];

  const cursorCoordinate = {
    lineIndex: state.cursorCoordinate.lineIndex + 1,
    charIndex: Math.min(state.cursorCoordinate.charIndex, nextLine.length),
  };
  const textSelection = (() => {
    if (!event.shiftKey) return undefined;
    const fixed = state.textSelection ? state.textSelection.fixed : state.cursorCoordinate;
    const free = { ...cursorCoordinate };
    return !coordinatesAreEqual(fixed, free) ? { fixed, free } : undefined;
  })();
  return [text, { ...state, cursorCoordinate, textSelection }];
}

export function handleOnMoveLeft(
  text: string,
  state: State,
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];

  const cursorCoordinate = moveCursor(text, state.cursorCoordinate, -1);
  const textSelection = (() => {
    if (!event.shiftKey) return undefined;
    const fixed = state.textSelection ? state.textSelection.fixed : state.cursorCoordinate;
    const free = { ...cursorCoordinate };
    return !coordinatesAreEqual(fixed, free) ? { fixed, free } : undefined;
  })();
  return [text, { ...state, cursorCoordinate, textSelection }];
}

export function handleOnMoveRight(
  text: string,
  state: State,
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];

  const cursorCoordinate = moveCursor(text, state.cursorCoordinate, 1);
  const textSelection = (() => {
    if (!event.shiftKey) return undefined;
    const fixed = state.textSelection ? state.textSelection.fixed : state.cursorCoordinate;
    const free = { ...cursorCoordinate };
    return !coordinatesAreEqual(fixed, free) ? { fixed, free } : undefined;
  })();
  return [text, { ...state, cursorCoordinate, textSelection }];
}

export function handleOnMoveWordTop(
  text: string,
  state: State,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];

  const cursorCoordinate = (() => {
    const wordRegex = new RegExp(TextLinesConstants.wordRegex, 'g');
    const lines = text.split('\n');
    const currentLine = lines[state.cursorCoordinate.lineIndex];
    let charIndex: number | undefined = undefined;
    let match: RegExpExecArray | null = null;
    while ((match = wordRegex.exec(currentLine))) {
      if (match === null) break;
      const candidateIndex = wordRegex.lastIndex - match[0].length;
      if (candidateIndex >= state.cursorCoordinate.charIndex) break;
      charIndex = candidateIndex;
    }
    return { lineIndex: state.cursorCoordinate.lineIndex, charIndex: charIndex || 0 };
  })();
  const textSelection = (() => {
    if (!event.shiftKey) return undefined;
    const fixed = state.textSelection ? state.textSelection.fixed : state.cursorCoordinate;
    const free = { ...cursorCoordinate };
    return !coordinatesAreEqual(fixed, free) ? { fixed, free } : undefined;
  })();
  return [text, { ...state, cursorCoordinate, textSelection }];
}

export function handleOnMoveWordBottom(
  text: string,
  state: State,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];

  const cursorCoordinate = (() => {
    const wordRegex = new RegExp(TextLinesConstants.wordRegex, 'g');
    const lines = text.split('\n');
    const currentLine = lines[state.cursorCoordinate.lineIndex];
    let match: RegExpExecArray | null = null;
    while ((match = wordRegex.exec(currentLine))) {
      if (match === null) break;
      const candidateIndex = wordRegex.lastIndex;
      if (candidateIndex > state.cursorCoordinate.charIndex) {
        return { lineIndex: state.cursorCoordinate.lineIndex, charIndex: candidateIndex };
      }
    }
    return { lineIndex: state.cursorCoordinate.lineIndex, charIndex: currentLine.length };
  })();
  const textSelection = (() => {
    if (!event.shiftKey) return undefined;
    const fixed = state.textSelection ? state.textSelection.fixed : state.cursorCoordinate;
    const free = { ...cursorCoordinate };
    return !coordinatesAreEqual(fixed, free) ? { fixed, free } : undefined;
  })();
  return [text, { ...state, cursorCoordinate, textSelection }];
}

export function handleOnMoveLineTop(
  text: string,
  state: State,
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];

  const cursorCoordinate = { lineIndex: state.cursorCoordinate.lineIndex, charIndex: 0 };
  const textSelection = (() => {
    if (!event.shiftKey) return undefined;
    const fixed = state.textSelection ? state.textSelection.fixed : state.cursorCoordinate;
    const free = { ...cursorCoordinate };
    return !coordinatesAreEqual(fixed, free) ? { fixed, free } : undefined;
  })();
  return [text, { ...state, cursorCoordinate, textSelection }];
}

export function handleOnMoveLineBottom(
  text: string,
  state: State,
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];

  const lines = text.split('\n');
  const cursorCoordinate = {
    lineIndex: state.cursorCoordinate.lineIndex,
    charIndex: lines[state.cursorCoordinate.lineIndex].length,
  };
  const textSelection = (() => {
    if (!event.shiftKey) return undefined;
    const fixed = state.textSelection ? state.textSelection.fixed : state.cursorCoordinate;
    const free = { ...cursorCoordinate };
    return !coordinatesAreEqual(fixed, free) ? { fixed, free } : undefined;
  })();
  return [text, { ...state, cursorCoordinate, textSelection }];
}

export function handleOnMoveTextTop(
  text: string,
  state: State,
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];

  const cursorCoordinate = { lineIndex: 0, charIndex: 0 };
  const textSelection = (() => {
    if (!event.shiftKey) return undefined;
    const fixed = state.textSelection ? state.textSelection.fixed : state.cursorCoordinate;
    const free = { ...cursorCoordinate };
    return !coordinatesAreEqual(fixed, free) ? { fixed, free } : undefined;
  })();
  return [text, { ...state, cursorCoordinate, textSelection }];
}

export function handleOnMoveTextBottom(
  text: string,
  state: State,
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];

  const lines = text.split('\n');
  const cursorCoordinate = {
    lineIndex: lines.length - 1,
    charIndex: lines[lines.length - 1].length,
  };
  const textSelection = (() => {
    if (!event.shiftKey) return undefined;
    const fixed = state.textSelection ? state.textSelection.fixed : state.cursorCoordinate;
    const free = { ...cursorCoordinate };
    return !coordinatesAreEqual(fixed, free) ? { fixed, free } : undefined;
  })();
  return [text, { ...state, cursorCoordinate, textSelection }];
}
