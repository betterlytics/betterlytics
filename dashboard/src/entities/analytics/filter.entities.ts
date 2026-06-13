import { z } from 'zod';

import { generateTempId } from '@/utils/temporaryId';

export const FILTER_COLUMNS = [
  'url',
  'domain',
  'device_type',
  'country_code',
  'subdivision_code',
  'city',
  'browser',
  'os',
  'referrer_source',
  'referrer_source_name',
  'referrer_search_term',
  'referrer_url',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'event_type',
  'custom_event_name',
  'outbound_link_url',
] as const;

export const GP_PREFIX = 'gp.';

export const FILTER_OPERATORS = ['=', '!='] as const;

export const MAX_FILTER_ROWS = 10;

const GP_KEY_PATTERN = /^[^\p{C}]{1,64}$/u;

export const FilterColumnSchema = z.union([
  z.enum(FILTER_COLUMNS),
  z
    .string()
    .startsWith(GP_PREFIX)
    .refine((s) => GP_KEY_PATTERN.test(s.slice(GP_PREFIX.length)), {
      message: 'Invalid global property key',
    }),
]) as z.ZodType<FilterColumn>;

export const QueryFilterSchema = z.object({
  id: z.string(),
  column: FilterColumnSchema,
  operator: z.enum(FILTER_OPERATORS),
  values: z.array(z.string()),
});

export type QueryFilter = z.infer<typeof QueryFilterSchema>;

export function createEmptyQueryFilter(): QueryFilter {
  return { id: generateTempId(), column: 'url', operator: '=', values: [] };
}

/**
 * A filter is usable in a query once it has a column, an operator, and at least
 * one non-empty value. Incomplete filters are skipped.
 */
export function isUsableFilter(filter: QueryFilter): boolean {
  return Boolean(filter.column) && Boolean(filter.operator) && filter.values.every(Boolean);
}

export type FilterColumn = TableFilterColumn | `gp.${string}`;
export type TableFilterColumn = (typeof FILTER_COLUMNS)[number];
export type FilterOperator = (typeof FILTER_OPERATORS)[number];

/**
 * Discriminated form of a filter column, produced by parseFilterColumn.
 * SQL-building code should operate on this — never on raw FilterColumn strings.
 */
export type ParsedFilterColumn = { kind: 'standard'; col: TableFilterColumn } | { kind: 'gp'; key: string };

/**
 * Narrow a validated FilterColumn into a discriminated union suitable for SQL.
 * Assumes input has already passed FilterColumnSchema (e.g. via tRPC / QueryFilterSchema).
 */
export function parseFilterColumn(col: FilterColumn): ParsedFilterColumn {
  if (isGlobalPropertyColumn(col)) {
    return { kind: 'gp', key: col.slice(GP_PREFIX.length) };
  }

  return { kind: 'standard', col };
}

function isGlobalPropertyColumn(col: FilterColumn): col is `gp.${string}` {
  return col.startsWith(GP_PREFIX);
}

export function isFilterColumn(value: string): value is FilterColumn {
  return FilterColumnSchema.safeParse(value).success;
}
