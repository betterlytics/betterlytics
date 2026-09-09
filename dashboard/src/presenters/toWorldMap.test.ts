import { describe, expect, it } from 'vitest';
import { CountryCodeFormat, dataToWorldMap } from './toWorldMap';

const row = (country_code: string, visitors: number) => ({ country_code, visitors });

describe('dataToWorldMap', () => {
  it('maps rows to feature codes without transformation', () => {
    const result = dataToWorldMap([row('DK', 5), row('US', 9)], [row('DK', 3)], CountryCodeFormat.Original);
    expect(result.visitorData).toEqual([
      { code: 'DK', visitors: 5 },
      { code: 'US', visitors: 9 },
    ]);
    expect(result.compareData).toEqual([{ code: 'DK', visitors: 3 }]);
    expect(result.maxVisitors).toBe(9);
  });

  it('transforms alpha-3 codes to alpha-2', () => {
    const result = dataToWorldMap([row('DNK', 5)], [], CountryCodeFormat.ToAlpha2);
    expect(result.visitorData[0].code).toBe('DK');
  });

  it('keeps untransformable codes and excludes Localhost from maxVisitors', () => {
    const result = dataToWorldMap([row('Localhost', 99), row('DK', 4)], [], CountryCodeFormat.Original);
    expect(result.visitorData[0].code).toBe('Localhost');
    expect(result.maxVisitors).toBe(4);
  });

  it('returns maxVisitors 1 for empty data', () => {
    expect(dataToWorldMap([], [], CountryCodeFormat.Original).maxVisitors).toBe(1);
  });
});
