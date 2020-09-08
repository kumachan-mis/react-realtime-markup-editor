import { State, OptionState, SelectionWithMouse, ShortcutCommand } from "./types";
import { EditorConstants } from "./constants";

import { moveCursor, cursorCoordinateToTextIndex, coordinatesAreEqual } from "../Cursor/utils";
import { selectionToRange, getSelectedText } from "../Selection/utils";
import { CursorCoordinate } from "../Cursor/types";
import { TextLinesConstants } from "../TextLines/constants";
import { classNameToSelector, isMacOS } from "../common";

export function getRoot(element: HTMLElement): HTMLElement | null {
  return element.closest(`div${classNameToSelector(EditorConstants.root.className)}`);
}

export function getEditor(element: HTMLElement): HTMLElement | null {
  return element.closest(`div${classNameToSelector(EditorConstants.editor.className)}`);
}

export function handleOnMouseDown(
  text: string,
  state: State,
  option: OptionState,
  position: [number, number],
  element: HTMLElement | null
): [string, State, OptionState] {
  if (!element) return [text, state, option];
  const cursorCoordinate = positionToCursorCoordinate(text, state, option, position, element);

  return [
    text,
    { ...state, cursorCoordinate, textSelection: undefined },
    { ...option, selectionWithMouse: SelectionWithMouse.Started },
  ];
}

export function handleOnMouseMove(
  text: string,
  state: State,
  option: OptionState,
  position: [number, number],
  element: HTMLElement | null
): [string, State, OptionState] {
  if (
    !state.cursorCoordinate ||
    option.selectionWithMouse == SelectionWithMouse.Inactive ||
    !element
  ) {
    return [text, state, option];
  }
  if (option.selectionWithMouse == SelectionWithMouse.Started) {
    return [text, state, { ...option, selectionWithMouse: SelectionWithMouse.Active }];
  }
  const cursorCoordinate = positionToCursorCoordinate(text, state, option, position, element);
  if (coordinatesAreEqual(cursorCoordinate, state.cursorCoordinate)) return [text, state, option];
  const fixed = state.textSelection ? state.textSelection.fixed : { ...state.cursorCoordinate };
  const free = { ...cursorCoordinate };
  const textSelection = !coordinatesAreEqual(fixed, free) ? { fixed, free } : undefined;
  return [text, { ...state, cursorCoordinate, textSelection }, option];
}

export function handleOnMouseUp(
  text: string,
  state: State,
  option: OptionState,
  position: [number, number],
  element: HTMLElement | null
): [string, State, OptionState] {
  if (
    !state.cursorCoordinate ||
    option.selectionWithMouse == SelectionWithMouse.Inactive ||
    !element
  ) {
    return [text, state, option];
  }
  if (option.selectionWithMouse != SelectionWithMouse.Active) {
    return [text, state, { ...option, selectionWithMouse: SelectionWithMouse.Inactive }];
  }
  const cursorCoordinate = positionToCursorCoordinate(text, state, option, position, element);
  const fixed = state.textSelection ? state.textSelection.fixed : { ...state.cursorCoordinate };
  const free = { ...cursorCoordinate };
  const textSelection = !coordinatesAreEqual(fixed, free) ? { fixed, free } : undefined;
  return [
    text,
    { ...state, cursorCoordinate, textSelection },
    { ...option, selectionWithMouse: SelectionWithMouse.Inactive },
  ];
}

export const handleOnMouseLeave = handleOnMouseUp;

export function handleOnKeyDown(
  text: string,
  state: State,
  event: React.KeyboardEvent<HTMLTextAreaElement>
): [string, State] {
  const command = shortcutCommand(event);
  if (!state.cursorCoordinate || state.isComposing || (event.key.length == 1 && !command)) {
    return [text, state];
  }
  event.preventDefault();

  switch (event.key) {
    case "Enter": {
      const [newText, newState] = insertText(text, state, "\n");
      if (!newState.cursorCoordinate) return [newText, newState];

      const newLines = newText.split("\n");
      const prevLine = newLines[newState.cursorCoordinate.lineIndex - 1];
      const regex = TextLinesConstants.regexes.indent;
      const { indent, content } = prevLine.match(regex)?.groups as Record<string, string>;
      if (indent.length == 0) {
        return [newText, newState];
      } else if (content.length > 0) {
        return insertText(newText, newState, indent);
      } else {
        const backCoordinate = moveCursor(newText, newState.cursorCoordinate, -indent.length - 1);
        const textSelection = { fixed: newState.cursorCoordinate, free: backCoordinate };
        return insertText(newText, { ...newState, textSelection }, "");
      }
    }
    case "Tab": {
      const [newText, newState] = insertText(text, state, "\t");
      if (!newState.cursorCoordinate) return [newText, newState];

      const newLines = newText.split("\n");
      const { lineIndex, charIndex } = newState.cursorCoordinate;
      const currentLine = newLines[lineIndex];
      if (!/^ *$/.test(currentLine.substring(0, charIndex - 1))) return [newText, newState];

      const backCoordinate = moveCursor(newText, newState.cursorCoordinate, -1);
      const textSelection = { fixed: newState.cursorCoordinate, free: backCoordinate };
      return insertText(newText, { ...newState, textSelection }, " ");
    }
    case "Backspace": {
      if (state.textSelection) return insertText(text, state, "");
      const backCoordinate = moveCursor(text, state.cursorCoordinate, -1);
      const textSelection = { fixed: state.cursorCoordinate, free: backCoordinate };
      return insertText(text, { ...state, textSelection }, "");
    }
    case "ArrowUp": {
      const lines = text.split("\n");
      const prevLine = lines[state.cursorCoordinate.lineIndex - 1];
      if (prevLine === undefined) return [text, state];
      const cursorCoordinate = {
        lineIndex: state.cursorCoordinate.lineIndex - 1,
        charIndex: Math.min(state.cursorCoordinate.charIndex, prevLine.length),
      };
      return [text, { ...state, cursorCoordinate, textSelection: undefined }];
    }
    case "ArrowDown": {
      const lines = text.split("\n");
      const nextLine = lines[state.cursorCoordinate.lineIndex + 1];
      if (nextLine === undefined) return [text, state];
      const cursorCoordinate = {
        lineIndex: state.cursorCoordinate.lineIndex + 1,
        charIndex: Math.min(state.cursorCoordinate.charIndex, nextLine.length),
      };
      return [text, { ...state, cursorCoordinate, textSelection: undefined }];
    }
    case "ArrowLeft": {
      const cursorCoordinate = moveCursor(text, state.cursorCoordinate, -1);
      return [text, { ...state, cursorCoordinate, textSelection: undefined }];
    }
    case "ArrowRight": {
      const cursorCoordinate = moveCursor(text, state.cursorCoordinate, 1);
      return [text, { ...state, cursorCoordinate, textSelection: undefined }];
    }
    default:
      return handleOnShortcut(text, state, command);
  }
}

export function handleOnChange(
  text: string,
  state: State,
  event: React.ChangeEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];
  if (state.isComposing) return [text, { ...state, textAreaValue: event.target.value }];
  const [newText, newState] = insertText(text, state, event.target.value);
  return [newText, newState];
}

export function handleOnCompositionStart(
  text: string,
  state: State,
  event: React.CompositionEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate || state.isComposing) return [text, state];
  return [text, { ...state, isComposing: true }];
}

export function handleOnCompositionEnd(
  text: string,
  state: State,
  event: React.CompositionEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate || !state.isComposing) return [text, state];
  const [newText, newState] = insertText(text, state, event.data);
  return [newText, { ...newState, textAreaValue: "", isComposing: false }];
}

export function handleOnCut(
  text: string,
  state: State,
  event: React.ClipboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate || !state.textSelection) return [text, state];
  event.preventDefault();
  const selectedText = getSelectedText(state.textSelection, text);
  event.clipboardData.setData("text/plain", selectedText);
  return insertText(text, state, "");
}

export function handleOnCopy(
  text: string,
  state: State,
  event: React.ClipboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate || !state.textSelection) return [text, state];
  event.preventDefault();
  const selectedText = getSelectedText(state.textSelection, text);
  event.clipboardData.setData("text/plain", selectedText);
  return [text, state];
}

export function handleOnPaste(
  text: string,
  state: State,
  event: React.ClipboardEvent<HTMLTextAreaElement>
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];
  event.preventDefault();
  const textToPaste = event.clipboardData.getData("text");
  return insertText(text, state, textToPaste);
}

function insertText(
  text: string,
  state: State,
  insertedText: string,
  cursourMoveAmount = insertedText.length
): [string, State] {
  if (!state.cursorCoordinate) return [text, state];

  if (!state.textSelection) {
    const insertIndex = cursorCoordinateToTextIndex(text, state.cursorCoordinate);
    const newText = text.substring(0, insertIndex) + insertedText + text.substring(insertIndex);
    const cursorCoordinate = moveCursor(newText, state.cursorCoordinate, cursourMoveAmount);
    return [newText, { ...state, cursorCoordinate, textSelection: undefined }];
  }

  const { start, end } = selectionToRange(state.textSelection);
  const startIndex = cursorCoordinateToTextIndex(text, start);
  const endIndex = cursorCoordinateToTextIndex(text, end);
  const newText = text.substring(0, startIndex) + insertedText + text.substring(endIndex);
  const cursorCoordinate = moveCursor(newText, start, cursourMoveAmount);
  return [newText, { ...state, cursorCoordinate, textSelection: undefined }];
}

function positionToCursorCoordinate(
  text: string,
  state: State,
  option: OptionState,
  position: [number, number],
  element: HTMLElement
): CursorCoordinate {
  type Groups = Record<string, string>;

  const [x, y] = position;
  const elements = document.elementsFromPoint(x, y);
  const charClassNameRegex = TextLinesConstants.char.classNameRegex;
  const charElement = elements.find(
    (charEl) => charClassNameRegex.test(charEl.className) && element.contains(charEl)
  );
  const lineClassNameRegex = TextLinesConstants.line.classNameRegex;
  const lineElement = elements.find(
    (lineEl) => lineClassNameRegex.test(lineEl.className) && element.contains(lineEl)
  );
  const lines = text.split("\n");
  if (charElement) {
    const groups = charElement.className.match(charClassNameRegex)?.groups as Groups;
    const lineIndex = Number.parseInt(groups["lineIndex"], 10);
    const charIndex = Number.parseInt(groups["charIndex"], 10);
    return { lineIndex, charIndex };
  } else if (lineElement) {
    const groups = lineElement.className.match(lineClassNameRegex)?.groups as Groups;
    const lineIndex = Number.parseInt(groups["lineIndex"], 10);
    return { lineIndex, charIndex: lines[lineIndex].length };
  } else if (option.selectionWithMouse == SelectionWithMouse.Active && state.cursorCoordinate) {
    return { ...state.cursorCoordinate };
  } else {
    return { lineIndex: lines.length - 1, charIndex: lines[lines.length - 1].length };
  }
}

function shortcutCommand(
  event: React.KeyboardEvent<HTMLTextAreaElement>
): ShortcutCommand | undefined {
  if (selectAllTriggered(event)) return "selectAll";
  return undefined;
}

function selectAllTriggered(event: React.KeyboardEvent<HTMLTextAreaElement>): boolean {
  return (
    (!isMacOS() ? event.ctrlKey && !event.metaKey : event.metaKey && !event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey &&
    event.key == "a"
  );
}

function handleOnShortcut(
  text: string,
  state: State,
  command: ShortcutCommand | undefined
): [string, State] {
  if (command == "selectAll") return handleOnSelectAll(text, state);
  return [text, state];
}

function handleOnSelectAll(text: string, state: State): [string, State] {
  console.log("handleOnSelectAll");
  if (!state.cursorCoordinate) return [text, state];
  const lines = text.split("\n");
  const textSelection = {
    fixed: { lineIndex: 0, charIndex: 0 },
    free: { lineIndex: lines.length - 1, charIndex: lines[lines.length - 1].length },
  };
  return [text, { ...state, textSelection }];
}
