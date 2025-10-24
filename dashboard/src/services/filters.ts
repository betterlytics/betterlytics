'server-only';

import { FilterColumn } from '@/entities/filter';
import { toDateTimeString } from '@/utils/dateFormatters';
import { getFilterDistinctValues } from '@/repositories/clickhouse/filters';

export type FilterInputType = 'text' | 'select' | 'combobox';
export type FilterUIConfig = Record<
  FilterColumn,
  { input: FilterInputType; serverFetch: boolean; search?: boolean; options?: string[] }
>;

export async function getDistinctValuesForFilterColumn(args: {
  siteId: string;
  startDate: Date;
  endDate: Date;
  column: FilterColumn;
  search?: string;
  limit?: number;
}) {
  const start = toDateTimeString(args.startDate);
  const end = toDateTimeString(args.endDate);

  return getFilterDistinctValues({
    siteId: args.siteId,
    startDate: start,
    endDate: end,
    column: args.column,
    search: args.search?.trim(),
    limit: args.limit,
  });
}
