import { describe, expect, it } from 'vitest';
import { getPageNumbers } from './PaginationControls';

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe('getPageNumbers on desktop', () => {
  it('lists every page up to six pages', () => {
    for (const total of range(6)) {
      expect(getPageNumbers(1, total, false)).toEqual(range(total));
    }
  });

  it('shows the first four pages near the start', () => {
    for (const current of [1, 2, 3, 4]) {
      expect(getPageNumbers(current, 120, false)).toEqual([1, 2, 3, 4, 'ellipsis-end', 120]);
    }
  });

  it('shows the current page with a neighbour on each side in the middle', () => {
    expect(getPageNumbers(5, 120, false)).toEqual([1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 120]);
    expect(getPageNumbers(60, 120, false)).toEqual([1, 'ellipsis-start', 59, 60, 61, 'ellipsis-end', 120]);
    expect(getPageNumbers(116, 120, false)).toEqual([1, 'ellipsis-start', 115, 116, 117, 'ellipsis-end', 120]);
  });

  it('shows the last five pages near the end', () => {
    for (const current of [117, 118, 119, 120]) {
      expect(getPageNumbers(current, 120, false)).toEqual([1, 'ellipsis-start', 116, 117, 118, 119, 120]);
    }
  });
});

describe('getPageNumbers on mobile', () => {
  it('lists every page up to five pages', () => {
    for (const total of range(5)) {
      expect(getPageNumbers(1, total, true)).toEqual(range(total));
    }
  });

  it('shows the first three pages and the last near the start', () => {
    for (const current of [1, 2, 3]) {
      expect(getPageNumbers(current, 120, true)).toEqual([1, 2, 3, 'ellipsis-end', 120]);
    }
  });

  it('shows the first, current and last page in the middle', () => {
    expect(getPageNumbers(4, 120, true)).toEqual([1, 'ellipsis-start', 4, 'ellipsis-end', 120]);
    expect(getPageNumbers(60, 120, true)).toEqual([1, 'ellipsis-start', 60, 'ellipsis-end', 120]);
    expect(getPageNumbers(117, 120, true)).toEqual([1, 'ellipsis-start', 117, 'ellipsis-end', 120]);
  });

  it('shows the first page and the last three near the end', () => {
    for (const current of [118, 119, 120]) {
      expect(getPageNumbers(current, 120, true)).toEqual([1, 'ellipsis-start', 118, 119, 120]);
    }
  });

  it('never shows more than five items and always includes the current page', () => {
    for (const total of [6, 7, 10, 120, 10_000]) {
      for (const current of range(total)) {
        const items = getPageNumbers(current, total, true);
        expect(items.length).toBeLessThanOrEqual(5);
        expect(items).toContain(current);
      }
    }
  });
});
