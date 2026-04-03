import { z } from 'zod';

export const STATIC_FILTER_COLUMNS = [
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

export const FILTER_OPERATORS = ['=', '!='] as const;

export const GLOBAL_PROPERTY_PREFIX = 'gp:';

export function isGlobalPropertyFilter(column: string): boolean {
  return column.startsWith(GLOBAL_PROPERTY_PREFIX);
}

export function getGlobalPropertyKey(column: string): string {
  return column.slice(GLOBAL_PROPERTY_PREFIX.length);
}

export function toGlobalPropertyColumn(key: string): string {
  return `${GLOBAL_PROPERTY_PREFIX}${key}`;
}

export const FilterColumnSchema = z.string().refine(
  (val) => {
    if (val.startsWith(GLOBAL_PROPERTY_PREFIX)) return true;
    return (STATIC_FILTER_COLUMNS as readonly string[]).includes(val);
  },
  { message: 'Invalid filter column' },
);

export const QueryFilterSchema = z.object({
  id: z.string(),
  column: FilterColumnSchema,
  operator: z.enum(FILTER_OPERATORS),
  values: z.array(z.string()),
});

export type QueryFilter = z.infer<typeof QueryFilterSchema>;
export type StaticFilterColumn = (typeof STATIC_FILTER_COLUMNS)[number];
export type FilterColumn = StaticFilterColumn | `gp:${string}`;
export type FilterOperator = (typeof FILTER_OPERATORS)[number];
