import { describe, it, expect } from 'vitest';
import { formatString } from '@/utils/formatters';

const ofLength = (length: number) => 'abcdefghijklmnopqrstuvwxyz0123456789'.repeat(3).slice(0, length);

describe('formatString', () => {
  it('keeps values up to the limit whole', () => {
    expect(formatString(ofLength(24), 25)).toBe(ofLength(24));
    expect(formatString(ofLength(25), 25)).toBe(ofLength(25));
  });

  it('keeps values that shortening would not make shorter whole', () => {
    expect(formatString(ofLength(26), 25)).toBe(ofLength(26));
    expect(formatString(ofLength(27), 25)).toBe(ofLength(27));
    expect(formatString(ofLength(33), 32)).toBe(ofLength(33));
    expect(formatString(ofLength(35), 32)).toBe(ofLength(35));
  });

  it('shortens values further over the limit in the middle', () => {
    expect(formatString(ofLength(28), 25)).toBe('abcdefghijkl...qrstuvwxyz01');
    expect(formatString(ofLength(36), 32)).toBe('abcdefghijklmnop...uvwxyz0123456789');
  });

  it('never makes a value longer', () => {
    for (const maxLength of [17, 24, 25, 30, 32, 50]) {
      for (let length = 0; length <= 80; length++) {
        expect(formatString(ofLength(length), maxLength).length).toBeLessThanOrEqual(length);
      }
    }
  });

  it('defaults to a limit of 50', () => {
    expect(formatString(ofLength(53))).toBe(ofLength(53));
    expect(formatString(ofLength(54))).toHaveLength(53);
  });
});
