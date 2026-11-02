import { describe, expect, it } from 'vitest';
import { calculatePercentageChange } from '@/utils/percentageChange';

describe('calculatePercentageChange', () => {
  it('returns the change relative to the compare value', () => {
    expect(calculatePercentageChange(150, 100)).toBe(50);
    expect(calculatePercentageChange(50, 100)).toBe(-50);
    expect(calculatePercentageChange(100, 100)).toBe(0);
  });

  it('has no answer without a compare value or when growing from zero', () => {
    expect(calculatePercentageChange(10, undefined)).toBeUndefined();
    expect(calculatePercentageChange(10, 0)).toBeUndefined();
  });

  it('treats zero against zero as unchanged', () => {
    expect(calculatePercentageChange(0, 0)).toBe(0);
  });
});
