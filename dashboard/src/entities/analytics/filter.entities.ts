import { z } from 'zod';

import { generateTempId } from '@/utils/temporaryId';
import { PROPERTY_SOURCES, detectPropertySource, type PropertySourceKind } from './propertySources';

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

export const FILTER_OPERATORS = ['=', '!='] as const;

export const MAX_FILTER_ROWS = 10;

/** Shared key constraint for every property source: 1-64 chars, no control chars. */
export const PROPERTY_KEY_PATTERN = /^[^\p{C}]{1,64}$/u;

export const FilterColumnSchema = z.union([
  z.enum(FILTER_COLUMNS),
  z.string().refine(
    (s) => {
      const source = detectPropertySource(s);
      return source !== null && PROPERTY_KEY_PATTERN.test(s.slice(PROPERTY_SOURCES[source].prefix.length));
    },
    { message: 'Invalid property column' },
  ),
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

export function isNonEmptyValue(value: string): boolean {
  return value !== '';
}

/**
 * A filter is usable in a query once it has a column, an operator, and at least
 * one non-empty value. Incomplete filters are skipped.
 */
export function isUsableFilter(filter: QueryFilter): boolean {
  return Boolean(filter.column) && Boolean(filter.operator) && filter.values.every(Boolean);
}

export type TableFilterColumn = (typeof FILTER_COLUMNS)[number];
export type FilterColumn = TableFilterColumn | `${PropertySourceKind}.${string}`;
export type FilterOperator = (typeof FILTER_OPERATORS)[number];

/**
 * Discriminated form of a filter column, produced by parseFilterColumn.
 * SQL-building code should operate on this - never on raw FilterColumn strings.
 */
export type ParsedFilterColumn =
  | { kind: 'standard'; col: TableFilterColumn }
  | { kind: 'property'; source: PropertySourceKind; key: string };

/**
 * Narrow a validated FilterColumn into a discriminated union suitable for SQL.
 * Assumes input has already passed FilterColumnSchema (e.g. via tRPC / QueryFilterSchema).
 */
export function parseFilterColumn(col: FilterColumn): ParsedFilterColumn {
  const source = detectPropertySource(col);
  if (source === null) {
    return { kind: 'standard', col: col as TableFilterColumn };
  }
  return { kind: 'property', source, key: col.slice(PROPERTY_SOURCES[source].prefix.length) };
}

export function isFilterColumn(value: string): value is FilterColumn {
  return FilterColumnSchema.safeParse(value).success;
}
