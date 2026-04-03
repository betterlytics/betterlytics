'server-only';

import { FilterColumn, isGlobalPropertyFilter, getGlobalPropertyKey, StaticFilterColumn } from '@/entities/analytics/filter.entities';
import { getFilterDistinctValues, getGlobalPropertyKeys, getGlobalPropertyValues } from '@/repositories/clickhouse/filters.repository';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getDistinctValuesForFilterColumn(
  siteQuery: BASiteQuery,
  column: FilterColumn,
  search?: string,
  limit?: number,
) {
  if (isGlobalPropertyFilter(column)) {
    const key = getGlobalPropertyKey(column);
    return getGlobalPropertyValues(siteQuery, key, search?.trim(), limit);
  }
  return getFilterDistinctValues(siteQuery, column as StaticFilterColumn, limit, search?.trim());
}

export async function getAvailableGlobalPropertyKeys(
  siteQuery: BASiteQuery,
  search?: string,
  limit?: number,
) {
  return getGlobalPropertyKeys(siteQuery, search?.trim(), limit);
}
