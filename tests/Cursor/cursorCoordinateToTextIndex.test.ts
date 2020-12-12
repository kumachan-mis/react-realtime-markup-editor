import { unittest } from '../unittest';
import { BaseTestCase } from '../unittest/types';

import { cursorCoordinateToTextIndex } from '../../src/Cursor/utils';
import { CursorCoordinate } from '../../src/Cursor/types';

interface TestCase extends BaseTestCase {
  testName: string;
  inputLines: string[];
  inputCursorCoordinate: CursorCoordinate;
  expectedIndex: number;
}

unittest<TestCase>('Cursor', 'cursorCoordinateToTextIndex', (_, testCase) => {
  const actualIndex = cursorCoordinateToTextIndex(
    testCase.inputLines.join('\n'),
    testCase.inputCursorCoordinate
  );
  expect(actualIndex).toEqual(testCase.expectedIndex);
});
