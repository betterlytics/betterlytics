'server-only';

import { type FilterColumn, parseFilterColumn } from '@/entities/analytics/filter.entities';
import { type PropertySourceKind } from '@/entities/analytics/propertySources';
import {
  getFilterDistinctValues,
  getPropertyKeys,
  getPropertyValues,
} from '@/repositories/clickhouse/filters.repository';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getDistinctValuesForFilterColumn(
  siteQuery: BASiteQuery,
  column: FilterColumn,
  search?: string,
  limit?: number,
) {
  const parsed = parseFilterColumn(column);
  if (parsed.kind === 'standard') {
    return getFilterDistinctValues(siteQuery, parsed.col, limit, search?.trim());
  }
  return getPropertyValues(siteQuery, parsed.source, parsed.key, search?.trim(), limit);
}

export async function getAvailablePropertyKeys(
  siteQuery: BASiteQuery,
  source: PropertySourceKind,
  search?: string,
  limit?: number,
) {
  return getPropertyKeys(siteQuery, source, search?.trim(), limit);
}
