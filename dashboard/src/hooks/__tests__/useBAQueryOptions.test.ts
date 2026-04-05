import { stableStringify } from '@/utils/stableStringify';
import { describe, expect, it } from 'vitest';

describe('useBAQueryOptions query key composition', () => {
  it('stableStringify produces deterministic output for equivalent objects', () => {
    const a = {
      endDate: new Date('2026-01-02'),
      startDate: new Date('2026-01-01'),
      filters: [{ col: 'url', op: 'eq', value: '/' }],
    };
    const b = {
      startDate: new Date('2026-01-01'),
      filters: [{ col: 'url', op: 'eq', value: '/' }],
      endDate: new Date('2026-01-02'),
    };
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it('stableStringify produces different output for different dates', () => {
    const a = { startDate: new Date('2026-01-01') };
    const b = { startDate: new Date('2026-01-02') };
    expect(stableStringify(a)).not.toBe(stableStringify(b));
  });
});
