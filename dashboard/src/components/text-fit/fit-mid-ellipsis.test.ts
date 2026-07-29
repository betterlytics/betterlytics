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

describe('fitMidEllipsis cluster integrity', () => {
  const REGIONAL = /[\u{1F1E6}-\u{1F1FF}]/u;
  const runsAreEven = (s: string) => {
    const units = [...s];
    let run = 0;
    for (const unit of units) {
      if (REGIONAL.test(unit)) {
        run += 1;
      } else {
        if (run % 2 === 1) return false;
        run = 0;
      }
    }
    return run % 2 === 0;
  };

  it('keeps regional-indicator pairs intact across all widths', () => {
    const value = 'ab\u{1F1E9}\u{1F1F0}\u{1F1EF}\u{1F1F5}yz';
    for (let px = 11; px <= 91; px += 10) {
      expect(runsAreEven(fitMidEllipsis(value, px, perUnit10))).toBe(true);
    }
  });

  it('never strands a skin-tone modifier at the cut', () => {
    const value = 'abcd\u{1F44D}\u{1F3FD}yz';
    for (let px = 11; px <= 91; px += 10) {
      const units = [...fitMidEllipsis(value, px, perUnit10)];
      units.forEach((unit, i) => {
        if (unit === '\u{1F3FD}') expect(units[i - 1]).toBe('\u{1F44D}');
      });
    }
  });
});
