import { describe, expect, it } from 'vitest';
import { scopeToCountry } from '@/lib/scopeToCountry';
import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

const siteQuery = {
  siteId: 'site',
  queryFilters: [{ id: 'user', column: 'device_type', operator: '=', values: ['mobile'] }],
} as unknown as BASiteQuery;

describe('scopeToCountry', () => {
  it('appends the country filter and keeps the user filters', () => {
    expect(scopeToCountry(siteQuery, 'DK').queryFilters).toEqual([
      { id: 'user', column: 'device_type', operator: '=', values: ['mobile'] },
      { id: 'subdivision-country', column: 'country_code', operator: '=', values: ['DK'] },
    ]);
  });

  it('leaves the input query untouched', () => {
    scopeToCountry(siteQuery, 'DK');
    expect(siteQuery.queryFilters).toHaveLength(1);
  });
});
