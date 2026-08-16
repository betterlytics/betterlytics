import { describe, it, expect } from 'vitest';
import { getStepBandCells } from './bandGeometry';

describe('getStepBandCells', () => {
  it('returns exactly numberOfSteps cells spanning 100 percent', () => {
    const cells = getStepBandCells(4);
    expect(cells).toHaveLength(4);
    expect(cells[0].left).toBe(0);
    const total = cells.reduce((sum, cell) => sum + cell.width, 0);
    expect(total).toBeCloseTo(100, 6);
  });

  it('produces strictly ascending, non-overlapping cells', () => {
    const cells = getStepBandCells(6);
    for (let i = 1; i < cells.length; i++) {
      expect(cells[i].left).toBeCloseTo(cells[i - 1].left + cells[i - 1].width, 6);
      expect(cells[i].width).toBeGreaterThan(0);
    }
  });

  it('places interior boundaries just left of the steps-grid columns', () => {
    const cells = getStepBandCells(4);
    const depthSpacing = (900 - 20 - 20 - 14 - 110) / 3;
    const expectedBoundary = ((20 + depthSpacing - 8) / 900) * 100;
    expect(cells[1].left).toBeCloseTo(expectedBoundary, 6);
  });

  it('handles the two-step minimum', () => {
    const cells = getStepBandCells(2);
    expect(cells).toHaveLength(2);
    expect(cells[1].left + cells[1].width).toBeCloseTo(100, 6);
  });
});
