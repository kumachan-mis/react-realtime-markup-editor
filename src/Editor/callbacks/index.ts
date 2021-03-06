import { shortcutCommand } from './shortcutCommands';
import {
  handleOnShortcut,
  handleOnForwardDelete,
  handleOnBackwardDelete,
  handleOnMoveUp,
  handleOnMoveDown,
  handleOnMoveLeft,
  handleOnMoveRight,
  handleOnMoveWordTop,
  handleOnMoveWordBottom,
  handleOnMoveLineTop,
  handleOnMoveLineBottom,
  handleOnMoveTextTop,
  handleOnMoveTextBottom,
} from './shortcutHandlers';
import { insertText, showSuggestion, insertSuggestion, resetSuggestion, positionToCursorCoordinate } from './utils';

import { Props, State } from '../types';
import { coordinatesAreEqual } from '../../Cursor/utils';
import { getWordSelection, getLineSelection, getSelectedText } from '../../Selection/utils';
import { TextLinesConstants } from '../../TextLines/constants';
import { isMacOS } from '../../common/utils';

export function handleOnMouseDown(
  text: string,
  state: State,
  event: React.MouseEvent,
  element: HTMLElement | null
): [string, State] {
  if (!element) return [text, state];

  const position: [number, number] = [event.clientX, event.clientY];
  const cursorCoordinate = positionToCursorCoordinate(text, state, position, element);
  const newState = resetSuggestion({
    ...state,
    cursorCoordinate,
    textSelection: undefined,
    selectionWithMouse: 'fired',
  });
  return [text, newState];
}

export function handleOnMouseMove(
  text: string,
  state: State,
  event: MouseEvent,
  element: HTMLElement | null
): [string, State] {
  if (!state.cursorCoordinate || state.selectionWithMouse == 'inactive' || !element) {
    return [text, state];
  }
  if (state.selectionWithMouse == 'fired') {
    return [text, { ...state, selectionWithMouse: 'active' }];
  }

  const position: [number, number] = [event.clientX, event.clientY];
  const cursorCoordinate = positionToCursorCoordinate(text, state, position, element);
  if (!cursorCoordinate || coordinatesAreEqual(cursorCoordinate, state.cursorCoordinate)) {
    return [text, state];
  }
  const fixed = state.textSelection ? state.textSelection.fixed : { ...state.cursorCoordinate };
  const free = { ...cursorCoordinate };
  const textSelection = !coordinatesAreEqual(fixed, free) ? { fixed, free } : undefined;
  return [text, { ...state, cursorCoordinate, textSelection }];
}

export function handleOnMouseUp(
  text: string,
  state: State,
  event: MouseEvent,
  element: HTMLElement | null
): [string, State] {
  if (!state.cursorCoordinate || state.selectionWithMouse == 'inactive' || !element) {
    return [text, state];
  }
  if (state.selectionWithMouse != 'active') {
    return [text, { ...state, selectionWithMouse: 'inactive' }];
  }

  const position: [number, number] = [event.clientX, event.clientY];
  const cursorCoordinate = positionToCursorCoordinate(text, state, position, element);
  const fixed = state.textSelection ? state.textSelection.fixed : { ...state.cursorCoordinate };
  const free = cursorCoordinate ? cursorCoordinate : { ...state.cursorCoordinate };
  const textSelection = !coordinatesAreEqual(fixed, free) ? { fixed, free } : undefined;
  return [text, { ...state, cursorCoordinate, textSelection, selectionWithMouse: 'inactive' }];
}

export function handleOnClick(
  text: string,
  state: State,
  event: React.MouseEvent,
  element: HTMLElement | null
): [string, State] {
  if (!element) return [text, state];

  const position: [number, number] = [event.clientX, event.clientY];
  const cursorCoordinate = positionToCursorCoordinate(text, state, position, element);
  switch (event.detail) {
    case 2: {
      // double click
      const textSelection = getWordSelection(text, cursorCoordinate);
      return [text, { ...state, textSelection }];
    }
    case 3: {
      // triple click
      const textSelection = getLineSelection(text, cursorCoordinate);
      return [text, { ...state, textSelection }];
    }
    default:
      return [text, state];
  }
}

export function handleOnKeyDown(
  text: string,
  props: Props,
  state: State,
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  const command = shortcutCommand(event);
  if (!state.cursorCoordinate || state.isComposing || (event.key.length == 1 && !command)) {
    return [text, state];
  }

  event.preventDefault();
  event.nativeEvent.stopImmediatePropagation();

  switch (event.key) {
    case 'Tab': {
      return insertText(text, state, '\t');
    }
    case 'Enter': {
      if (state.suggestionType != 'none') {
        return insertSuggestion(text, state, state.suggestions[state.suggestionIndex]);
      }
      const [newText, newState] = insertText(text, state, '\n');
      if (!newState.cursorCoordinate) return [newText, newState];

      if (!props.syntax || props.syntax == 'bracket') {
        const newPrevLine = newText.split('\n')[newState.cursorCoordinate.lineIndex - 1];
        const groups = newPrevLine.match(TextLinesConstants.regexes.bracketSyntax.itemization)?.groups;
        if (!groups) return [newText, newState];
        return insertText(newText, newState, groups.indent + groups.bullet);
      } else if (props.syntax == 'markdown') {
        const newPrevLine = newText.split('\n')[newState.cursorCoordinate.lineIndex - 1];
        const groups = newPrevLine.match(TextLinesConstants.regexes.markdownSyntax.itemization)?.groups;
        if (!groups) return [newText, newState];
        return insertText(newText, newState, groups.indent + groups.bullet);
      }

      return [newText, newState];
    }
    case 'Backspace': {
      const [newText, newState] = handleOnBackwardDelete(text, state, event);
      return showSuggestion(newText, props, newState);
    }
    case 'Delete': {
      const [newText, newState] = handleOnForwardDelete(text, state, event);
      return showSuggestion(newText, props, newState);
    }
    case 'ArrowUp': {
      if (state.suggestions.length > 0) {
        const suggestionIndex = Math.max(state.suggestionIndex - 1, 0);
        return [text, { ...state, suggestionIndex: suggestionIndex }];
      }
      if (isMacOS() && event.metaKey && !event.ctrlKey && !event.altKey) {
        return handleOnMoveTextTop(text, state, event);
      }
      return handleOnMoveUp(text, state, event);
    }
    case 'ArrowDown': {
      if (state.suggestions.length > 0) {
        const suggestionIndex = Math.min(state.suggestionIndex + 1, state.suggestions.length - 1);
        return [text, { ...state, suggestionIndex: suggestionIndex }];
      }
      if (isMacOS() && event.metaKey && !event.ctrlKey && !event.altKey) {
        return handleOnMoveTextBottom(text, state, event);
      }
      return handleOnMoveDown(text, state, event);
    }
    case 'ArrowLeft': {
      if (isMacOS() && event.metaKey && !event.ctrlKey && !event.altKey) {
        return handleOnMoveLineTop(text, state, event);
      }
      if ((!isMacOS() ? event.ctrlKey && !event.altKey : event.altKey && !event.ctrlKey) && !event.metaKey) {
        return handleOnMoveWordTop(text, state, event);
      }
      const [newText, newState] = handleOnMoveLeft(text, state, event);
      return showSuggestion(newText, props, newState);
    }
    case 'ArrowRight': {
      if (isMacOS() && event.metaKey && !event.ctrlKey && !event.altKey) {
        return handleOnMoveLineBottom(text, state, event);
      }
      if ((!isMacOS() ? event.ctrlKey && !event.altKey : event.altKey && !event.ctrlKey) && !event.metaKey) {
        return handleOnMoveWordBottom(text, state, event);
      }
      const [newText, newState] = handleOnMoveRight(text, state, event);
      return showSuggestion(newText, props, newState);
    }
    case 'Home': {
      if ((!isMacOS() ? event.ctrlKey && !event.metaKey : event.metaKey && !event.ctrlKey) && !event.altKey) {
        return handleOnMoveTextTop(text, state, event);
      }
      return handleOnMoveLineTop(text, state, event);
    }
    case 'End': {
      if ((!isMacOS() ? event.ctrlKey && !event.metaKey : event.metaKey && !event.ctrlKey) && !event.altKey) {
        return handleOnMoveTextBottom(text, state, event);
      }
      return handleOnMoveLineBottom(text, state, event);
    }
    case 'Escape': {
      if (state.suggestionType == 'none') return [text, state];
      return [text, resetSuggestion(state)];
    }
    default:
      return handleOnShortcut(command, text, state, event);
  }
}

export function handleOnTextChange(
  text: string,
  props: Props,
  state: State,
  event: React.ChangeEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];

  const textAreaValue = event.target.value;
  if (state.isComposing) return [text, resetSuggestion({ ...state, textAreaValue })];

  const [newText, newState] = (() => {
    switch (textAreaValue) {
      case '[':
        return insertText(text, state, '[]', 1);
      case '{':
        return insertText(text, state, '{}', 1);
      case '(':
        return insertText(text, state, '()', 1);
      default:
        return insertText(text, state, textAreaValue);
    }
  })();
  return showSuggestion(newText, props, newState);
}

export function handleOnTextCompositionStart(
  text: string,
  state: State,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  event: React.CompositionEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate || state.isComposing) return [text, state];
  return [text, resetSuggestion({ ...state, isComposing: true })];
}

export function handleOnTextCompositionEnd(
  text: string,
  state: State,
  event: React.CompositionEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate || !state.isComposing) return [text, state];
  const [newText, newState] = insertText(text, state, event.data);
  return [newText, { ...newState, textAreaValue: '', isComposing: false }];
}

export function handleOnTextCut(
  text: string,
  state: State,
  event: React.ClipboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate || !state.textSelection) return [text, state];
  event.preventDefault();
  const selectedText = getSelectedText(text, state.textSelection);
  event.clipboardData.setData('text/plain', selectedText);
  return insertText(text, state, '');
}

export function handleOnTextCopy(
  text: string,
  state: State,
  event: React.ClipboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate || !state.textSelection) return [text, state];
  event.preventDefault();
  const selectedText = getSelectedText(text, state.textSelection);
  event.clipboardData.setData('text/plain', selectedText);
  return [text, state];
}

export function handleOnTextPaste(
  text: string,
  state: State,
  event: React.ClipboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];
  event.preventDefault();
  const textToPaste = event.clipboardData.getData('text');
  return insertText(text, state, textToPaste);
}

export function handleOnSuggectionMouseDown(
  text: string,
  state: State,
  event: React.MouseEvent<HTMLLIElement>
): [string, State] {
  event.preventDefault();
  event.stopPropagation();
  event.nativeEvent.stopImmediatePropagation();

  const suggestion = event.currentTarget.textContent;
  if (!suggestion) return [text, state];
  return insertSuggestion(text, state, suggestion);
}
