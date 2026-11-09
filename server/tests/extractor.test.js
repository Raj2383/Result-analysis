import { describe, it, expect } from 'vitest';
import { groupItemsIntoLines } from '../src/parsers/pdfCoordinateReader';

describe('groupItemsIntoLines', () => {
  it('groups items by y into lines, ordered top-down, left-to-right', () => {
    const items = [
      { str: 'WORLD', transform: [1, 0, 0, 1, 100, 700] },
      { str: 'HELLO', transform: [1, 0, 0, 1, 50, 700.5] },
      { str: 'second', transform: [1, 0, 0, 1, 50, 680] },
      { str: '  ', transform: [1, 0, 0, 1, 10, 680] },
      { str: 'line', transform: [1, 0, 0, 1, 110, 680.2] },
    ];
    expect(groupItemsIntoLines(items)).toEqual(['HELLO WORLD', 'second line']);
  });

  it('handles empty input', () => {
    expect(groupItemsIntoLines([])).toEqual([]);
    expect(groupItemsIntoLines(null)).toEqual([]);
  });
});
