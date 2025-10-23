'server-only';

import { FilterColumn } from '@/entities/filter';
import { toDateTimeString } from '@/utils/dateFormatters';
import { getFilterDistinctValues } from '@/repositories/clickhouse/filters';

export type FilterInputType = 'text' | 'select' | 'combobox';
export type FilterUIConfig = Record<
  FilterColumn,
  { input: FilterInputType; serverFetch: boolean; search?: boolean; options?: string[] }
>;

const EVENT_TYPE_OPTIONS = ['pageview', 'custom', 'outbound_link', 'cwv'] as const;

export function getFilterUIConfig(): FilterUIConfig {
  return {
    url: { input: 'combobox', serverFetch: true, search: true },
    device_type: { input: 'select', serverFetch: true },
    country_code: { input: 'select', serverFetch: true },
    browser: { input: 'select', serverFetch: true },
    os: { input: 'select', serverFetch: true },
    referrer_source: { input: 'select', serverFetch: true },
    referrer_source_name: { input: 'combobox', serverFetch: true, search: true },
    referrer_search_term: { input: 'combobox', serverFetch: true, search: true },
    referrer_url: { input: 'combobox', serverFetch: true, search: true },
    utm_source: { input: 'select', serverFetch: true },
    utm_medium: { input: 'select', serverFetch: true },
    utm_campaign: { input: 'select', serverFetch: true },
    utm_term: { input: 'combobox', serverFetch: true, search: true },
    utm_content: { input: 'combobox', serverFetch: true, search: true },
    event_type: { input: 'select', serverFetch: false, options: [...EVENT_TYPE_OPTIONS] },
    custom_event_name: { input: 'select', serverFetch: true, search: true },
  };
}

export function isDistinctableColumn(column: FilterColumn) {
  const cfg = getFilterUIConfig()[column];
  return cfg.serverFetch === true;
}

export async function getDistinctValuesForFilterColumn(args: {
  siteId: string;
  startDate: Date;
  endDate: Date;
  column: FilterColumn;
  search?: string;
  limit?: number;
}) {
  if (!isDistinctableColumn(args.column)) {
    throw new Error('Column not supported for distinct lookup');
  }
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

