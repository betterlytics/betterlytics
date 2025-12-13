'server-only';

import { FilterColumn } from '@/entities/analytics/filter.entities';
import { toDateTimeString } from '@/utils/dateFormatters';
import { getFilterDistinctValues } from '@/repositories/clickhouse/filters.repository';

export async function getDistinctValuesForFilterColumn(
  siteId: string,
  startDate: Date,
  endDate: Date,
  column: FilterColumn,
  search?: string,
  limit?: number,
) {
  return getFilterDistinctValues(
    siteId,
    toDateTimeString(startDate),
    toDateTimeString(endDate),
    column,
    limit,
    search?.trim(),
  );
}
