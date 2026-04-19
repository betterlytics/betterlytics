import { z } from 'zod';

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
] as const;

export const GP_PREFIX = 'gp.';

export const FILTER_OPERATORS = ['=', '!='] as const;

const GP_KEY_PATTERN = /^[\w.\-:]{1,64}$/;

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
export type FilterColumn = TableFilterColumn | `gp.${string}`;
export type TableFilterColumn = (typeof FILTER_COLUMNS)[number];
export type FilterOperator = (typeof FILTER_OPERATORS)[number];

/**
 * Discriminated form of a filter column, produced by parseFilterColumn.
 * SQL-building code should operate on this — never on raw FilterColumn strings.
 */
export type ParsedFilterColumn =
  | { kind: 'standard'; col: TableFilterColumn }
  | { kind: 'gp'; key: string };

/**
 * Narrow a validated FilterColumn into a discriminated union suitable for SQL.
 * Assumes input has already passed FilterColumnSchema (e.g. via tRPC / QueryFilterSchema).
 */
export function parseFilterColumn(col: FilterColumn): ParsedFilterColumn {
  if (col.startsWith(GP_PREFIX)) {
    return { kind: 'gp', key: col.slice(GP_PREFIX.length) };
  }
  // TS can't eliminate `gp.${string}` from the type after the prefix check,
  // but we know by exclusion the column is a TableFilterColumn here.
  return { kind: 'standard', col: col as TableFilterColumn };
}
