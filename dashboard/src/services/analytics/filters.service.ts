'server-only';

import { FilterColumn } from '@/entities/analytics/filter.entities';
import { getFilterDistinctValues, getGlobalPropertyKeys, getGlobalPropertyValues } from '@/repositories/clickhouse/filters.repository';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getDistinctValuesForFilterColumn(
  siteQuery: BASiteQuery,
  column: FilterColumn,
  search?: string,
  limit?: number,
  propertyKey?: string,
) {
  if (column === 'global_property' && propertyKey) {
    return getGlobalPropertyValues(siteQuery, propertyKey, search?.trim(), limit);
  }
  if (column === 'global_property') {
    return [];
  }
  return getFilterDistinctValues(siteQuery, column, limit, search?.trim());
}

export async function getAvailableGlobalPropertyKeys(
  siteQuery: BASiteQuery,
  search?: string,
  limit?: number,
) {
  return getGlobalPropertyKeys(siteQuery, search?.trim(), limit);
}
