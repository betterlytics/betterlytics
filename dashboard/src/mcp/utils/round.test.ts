import { describe, it, expect } from 'vitest';
import { round } from '@/mcp/utils/round';

describe('round', () => {
  it('rounds to the requested number of decimals', () => {
    expect(round(99.98765, 3)).toBe(99.988);
    expect(round(120.456, 1)).toBe(120.5);
    expect(round(800.99, 1)).toBe(801);
  });

  it('passes null and undefined straight through', () => {
    expect(round(null, 2)).toBeNull();
    expect(round(undefined, 2)).toBeNull();
  });

  it('keeps zero rather than treating it as absent', () => {
    expect(round(0, 2)).toBe(0);
  });

  it('handles negatives and whole numbers', () => {
    expect(round(-1.005, 2)).toBe(-1);
    expect(round(42, 3)).toBe(42);
  });
});
