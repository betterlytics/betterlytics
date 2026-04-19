'server-only';

import { type FilterColumn, parseFilterColumn } from '@/entities/analytics/filter.entities';
import {
  getFilterDistinctValues,
  getGlobalPropertyKeys,
  getGlobalPropertyValues,
} from '@/repositories/clickhouse/filters.repository';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getDistinctValuesForFilterColumn(
  siteQuery: BASiteQuery,
  column: FilterColumn,
  search?: string,
  limit?: number,
) {
  const parsed = parseFilterColumn(column);
  switch (parsed.kind) {
    case 'gp':
      return getGlobalPropertyValues(siteQuery, parsed.key, search?.trim(), limit);
    case 'standard':
      return getFilterDistinctValues(siteQuery, parsed.col, limit, search?.trim());
  }
}

export async function getAvailableGlobalPropertyKeys(siteQuery: BASiteQuery, search?: string, limit?: number) {
  return getGlobalPropertyKeys(siteQuery, search?.trim(), limit);
}
