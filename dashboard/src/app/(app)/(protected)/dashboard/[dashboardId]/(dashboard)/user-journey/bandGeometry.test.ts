import { describe, it, expect } from 'vitest';
import { getStepBandCells } from './bandGeometry';

describe('getStepBandCells', () => {
  it('returns numberOfSteps + 1 cells spanning exactly 100 percent', () => {
    const cells = getStepBandCells(3, 3);
    expect(cells).toHaveLength(4);
    expect(cells[0].left).toBe(0);
    const total = cells.reduce((sum, cell) => sum + cell.width, 0);
    expect(total).toBeCloseTo(100, 6);
  });

  it('produces strictly ascending, non-overlapping cells', () => {
    const cells = getStepBandCells(5, 5);
    for (let i = 1; i < cells.length; i++) {
      expect(cells[i].left).toBeCloseTo(cells[i - 1].left + cells[i - 1].width, 6);
      expect(cells[i].width).toBeGreaterThan(0);
    }
  });

  it('aligns interior boundaries just left of the sankey columns', () => {
    const cells = getStepBandCells(3, 3);
    const depthSpacing = (900 - 20 - 20 - 14 - 110) / 3;
    const expectedBoundary = ((20 + depthSpacing - 8) / 900) * 100;
    expect(cells[1].left).toBeCloseTo(expectedBoundary, 6);
  });

  it('returns a single full-width cell for numberOfSteps 1 boundaries beyond range', () => {
    const cells = getStepBandCells(1, 1);
    expect(cells).toHaveLength(2);
    expect(cells[1].left + cells[1].width).toBeCloseTo(100, 6);
  });

  it('falls back to equal-width cells when rendered data is shallower than the step window', () => {
    const cells = getStepBandCells(3, 1);
    expect(cells).toHaveLength(4);
    const total = cells.reduce((sum, cell) => sum + cell.width, 0);
    expect(total).toBeCloseTo(100, 6);
    expect(cells[1].left).toBeCloseTo(25, 6);
  });

  it('uses the chart-aligned boundary formula exactly at the fallback threshold', () => {
    const cells = getStepBandCells(5, 5);
    const depthSpacing = (900 - 20 - 20 - 14 - 110) / 5;
    const expectedBoundary = ((20 + depthSpacing - 8) / 900) * 100;
    expect(cells[1].left).toBeCloseTo(expectedBoundary, 6);
  });
});
