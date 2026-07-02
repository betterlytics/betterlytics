import { describe, it, expect } from 'vitest';
import { getStepBandCells } from './stepBandGeometry';

const sumOfWidths = (cells: Array<{ left: number; width: number }>) =>
  cells.reduce((total, cell) => total + cell.width, 0);

describe('getStepBandCells', () => {
  it('returns one cell per position spanning the full width', () => {
    const cells = getStepBandCells(4, true);
    expect(cells).toHaveLength(4);
    expect(cells[0].left).toBe(0);
    expect(sumOfWidths(cells)).toBeCloseTo(1, 10);
  });

  it('aligns inner boundaries just left of each node column', () => {
    const cells = getStepBandCells(4, true);
    const availableWidth = 900 - 20 - 20 - 14 - 110;
    const expectedSecondBoundary = (20 + availableWidth / 3 - 8) / 900;
    expect(cells[1].left).toBeCloseTo(expectedSecondBoundary, 10);
  });

  it('produces strictly increasing boundaries', () => {
    const cells = getStepBandCells(6, true);
    cells.forEach((cell) => expect(cell.width).toBeGreaterThan(0));
  });

  it('falls back to equal widths when not aligned to columns', () => {
    const cells = getStepBandCells(4, false);
    cells.forEach((cell) => expect(cell.width).toBeCloseTo(0.25, 10));
  });

  it('handles a single cell', () => {
    expect(getStepBandCells(1, true)).toEqual([{ left: 0, width: 1 }]);
  });
});
