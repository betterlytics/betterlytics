import { describe, expect, it } from 'vitest';
import { parseCountryParam } from '@/components/map/panel/params';

describe('parseCountryParam', () => {
  it('accepts a known two-letter country code', () => {
    expect(parseCountryParam('DK')).toBe('DK');
  });

  it('rejects everything else', () => {
    expect(parseCountryParam(null)).toBeUndefined();
    expect(parseCountryParam(undefined)).toBeUndefined();
    expect(parseCountryParam('')).toBeUndefined();
    expect(parseCountryParam('dk')).toBeUndefined();
    expect(parseCountryParam('DNK')).toBeUndefined();
    expect(parseCountryParam('D1')).toBeUndefined();
    expect(parseCountryParam('ZZ')).toBeUndefined();
  });
});
