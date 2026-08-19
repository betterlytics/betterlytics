import { describe, it, expect } from 'vitest';
import { getFailingSlot } from './deadRegion';

const nodesAtDepths = (...depths: number[]) => depths.map((depth) => ({ depth }));

describe('getFailingSlot', () => {
  it('attributes the first blank column to its own filters', () => {
    expect(getFailingSlot(nodesAtDepths(0, 1, 1), [2], 5)).toBe(2);
  });

  it('returns null when the first blank column has no filters', () => {
    expect(getFailingSlot(nodesAtDepths(0, 1), [4], 5)).toBeNull();
  });

  it('returns null when every column renders', () => {
    expect(getFailingSlot(nodesAtDepths(0, 1, 2), [1], 3)).toBeNull();
  });

  it('returns null for an empty chart', () => {
    expect(getFailingSlot([], [0], 4)).toBeNull();
  });

  it('returns null without any step filters', () => {
    expect(getFailingSlot(nodesAtDepths(0, 1), [], 5)).toBeNull();
  });
});
