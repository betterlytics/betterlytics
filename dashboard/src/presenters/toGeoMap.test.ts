import { describe, expect, it } from 'vitest';
import { dataToWorldMap, subdivisionsToGeoMap } from '@/presenters/toGeoMap';

const row = (country_code: string, visitors: number) => ({ country_code, visitors });

describe('dataToWorldMap', () => {
  it('maps rows to feature codes', () => {
    const result = dataToWorldMap([row('DK', 5), row('US', 9)], [row('DK', 3)]);
    expect(result.visitorData).toEqual([
      { code: 'DK', visitors: 5 },
      { code: 'US', visitors: 9 },
    ]);
    expect(result.compareData).toEqual([{ code: 'DK', visitors: 3 }]);
    expect(result.maxVisitors).toBe(9);
  });

  it('keeps Localhost rows but excludes them from maxVisitors', () => {
    const result = dataToWorldMap([row('Localhost', 99), row('DK', 4)], []);
    expect(result.visitorData[0].code).toBe('Localhost');
    expect(result.maxVisitors).toBe(4);
  });

  it('returns maxVisitors 1 for empty data', () => {
    expect(dataToWorldMap([], []).maxVisitors).toBe(1);
  });
});

describe('subdivisionsToGeoMap', () => {
  const sub = (country_code: string, subdivision_code: string, visitors: number) => ({
    country_code,
    subdivision_code,
    visitors,
  });

  it('keys features by subdivision code', () => {
    const result = subdivisionsToGeoMap([sub('DK', 'DK-84', 4), sub('DK', 'DK-85', 2)], [sub('DK', 'DK-84', 1)]);
    expect(result.visitorData).toEqual([
      { code: 'DK-84', visitors: 4 },
      { code: 'DK-85', visitors: 2 },
    ]);
    expect(result.compareData).toEqual([{ code: 'DK-84', visitors: 1 }]);
    expect(result.maxVisitors).toBe(4);
  });
});
