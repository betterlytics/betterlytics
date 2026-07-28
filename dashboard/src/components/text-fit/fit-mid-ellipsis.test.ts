import { describe, expect, it } from 'vitest';
import { ELLIPSIS, fitMidEllipsis, type MeasureFn } from './fit-mid-ellipsis';

const perUnit10: MeasureFn = (s) => [...s].length * 10;

describe('fitMidEllipsis', () => {
  it('returns the value unchanged when it fits', () => {
    expect(fitMidEllipsis('abcdef', 100, perUnit10)).toBe('abcdef');
  });

  it('returns the value unchanged at exactly budget', () => {
    expect(fitMidEllipsis('abcdef', 61, perUnit10)).toBe('abcdef');
  });

  it('cuts the middle keeping head-biased halves', () => {
    expect(fitMidEllipsis('abcdefghij', 61, perUnit10)).toBe(`abc${ELLIPSIS}ij`);
  });

  it('floors to the ellipsis alone when nothing fits', () => {
    expect(fitMidEllipsis('abcdefghij', 11, perUnit10)).toBe(ELLIPSIS);
    expect(fitMidEllipsis('abcdefghij', 0, perUnit10)).toBe(ELLIPSIS);
  });

  it('never splits surrogate pairs', () => {
    const value = '\u{1F600}\u{1F600}\u{1F600}\u{1F600}';
    const result = fitMidEllipsis(value, 31, perUnit10);
    expect(result).toBe(`\u{1F600}${ELLIPSIS}\u{1F600}`);
    for (const unit of result) {
      expect(unit.charCodeAt(0) >= 0xd800 && unit.charCodeAt(0) <= 0xdfff && unit.length === 1).toBe(false);
    }
  });

  it('nudges the cut outside ZWJ sequences', () => {
    const family = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
    const value = `ab${family}yz`;
    const result = fitMidEllipsis(value, 51, perUnit10);
    expect(result.includes('\u200D')).toBe(false);
  });

  it('never orphans a combining mark at the cut', () => {
    const value = 'ae\u0301bcdefgh';
    const result = fitMidEllipsis(value, 31, perUnit10);
    expect(result).not.toContain(`\u0301${ELLIPSIS}`);
    expect(result).not.toContain(`${ELLIPSIS}\u0301`);
    expect(result.startsWith('a')).toBe(true);
  });

  it('walks back when width is non-monotonic', () => {
    const spiky: MeasureFn = (s) => {
      const n = [...s].length;
      return n === 6 ? 200 : n * 10;
    };
    const result = fitMidEllipsis('abcdefghij', 61, spiky);
    expect(spiky(result)).toBeLessThanOrEqual(60);
  });

  it('is idempotent for a fixed width', () => {
    const once = fitMidEllipsis('abcdefghijklmnop', 81, perUnit10);
    expect(fitMidEllipsis(once, 81, perUnit10)).toBe(once);
  });
});
