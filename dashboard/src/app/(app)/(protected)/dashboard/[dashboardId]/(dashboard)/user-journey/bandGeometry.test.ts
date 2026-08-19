import { describe, it, expect } from 'vitest';
import { getStepBandGeometry } from './bandGeometry';

describe('getStepBandGeometry', () => {
  it('spans from the first column to the chart content right edge', () => {
    const band = getStepBandGeometry(4);
    expect(band.left).toBeCloseTo((20 / 900) * 100, 6);
    expect(band.left + band.width).toBeCloseTo(((900 - 20) / 900) * 100, 6);
  });

  it('returns exactly numberOfSteps cells spanning the band', () => {
    const { cells } = getStepBandGeometry(4);
    expect(cells).toHaveLength(4);
    expect(cells[0].left).toBeCloseTo(0, 6);
    const total = cells.reduce((sum, cell) => sum + cell.width, 0);
    expect(total).toBeCloseTo(100, 6);
  });

  it('produces strictly ascending, non-overlapping cells', () => {
    const { cells } = getStepBandGeometry(6);
    for (let i = 1; i < cells.length; i++) {
      expect(cells[i].left).toBeCloseTo(cells[i - 1].left + cells[i - 1].width, 6);
      expect(cells[i].width).toBeGreaterThan(0);
    }
  });

  it('places interior boundaries on the steps-grid columns relative to the band', () => {
    const { cells } = getStepBandGeometry(4);
    const depthSpacing = (900 - 20 - 20 - 14 - 110) / 3;
    const bandWidth = 900 - 20 - 20;
    expect(cells[1].left).toBeCloseTo((depthSpacing / bandWidth) * 100, 6);
  });

  it('handles the two-step minimum', () => {
    const { cells } = getStepBandGeometry(2);
    expect(cells).toHaveLength(2);
    expect(cells[1].left + cells[1].width).toBeCloseTo(100, 6);
  });
});
