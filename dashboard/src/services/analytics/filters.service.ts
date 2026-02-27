'server-only';

import { FilterColumn } from '@/entities/analytics/filter.entities';
import { getFilterDistinctValues } from '@/repositories/clickhouse/filters.repository';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getDistinctValuesForFilterColumn(
  siteQuery: BASiteQuery,
  column: FilterColumn,
  search?: string,
  limit?: number,
) {
  return getFilterDistinctValues(siteQuery, column, limit, search?.trim());
}
