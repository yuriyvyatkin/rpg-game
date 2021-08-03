import { calcTileType } from '../utils';

const borderSize = 3;

test.each([
  { index: 0, expected: 'top-left' },
  { index: 1, expected: 'top' },
  { index: 2, expected: 'top-right' },
  { index: 3, expected: 'left' },
  { index: 4, expected: 'center' },
  { index: 5, expected: 'right' },
  { index: 6, expected: 'bottom-left' },
  { index: 7, expected: 'bottom' },
  { index: 8, expected: 'bottom-right' },
])('function calcTileType works correctly', ({ index, expected }) => {
  expect(calcTileType(index, borderSize)).toBe(expected);
});
