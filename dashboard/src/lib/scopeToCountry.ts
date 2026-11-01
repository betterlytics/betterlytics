import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export function scopeToCountry(siteQuery: BASiteQuery, countryCode: string): BASiteQuery {
  return {
    ...siteQuery,
    queryFilters: [
      ...siteQuery.queryFilters,
      { id: 'subdivision-country', column: 'country_code', operator: '=', values: [countryCode] },
    ],
  };
}
