'server-only';

import { type FilterColumn } from '@/entities/analytics/filter.entities';
import { getFilterStrategy } from '@/entities/analytics/filterColumnStrategy';
import { getFilterDistinctValues, getGlobalPropertyKeys, getGlobalPropertyValues } from '@/repositories/clickhouse/filters.repository';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getDistinctValuesForFilterColumn(
  siteQuery: BASiteQuery,
  column: FilterColumn,
  search?: string,
  limit?: number,
) {
  const strategy = getFilterStrategy(column);
  switch (strategy.type) {
    case 'json_property':
      return getGlobalPropertyValues(siteQuery, strategy.key, search?.trim(), limit);
    default:
      return getFilterDistinctValues(siteQuery, column, limit, search?.trim());
  }
}

export async function getAvailableGlobalPropertyKeys(
  siteQuery: BASiteQuery,
  search?: string,
  limit?: number,
) {
  return getGlobalPropertyKeys(siteQuery, search?.trim(), limit);
}
