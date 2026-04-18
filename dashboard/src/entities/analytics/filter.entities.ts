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

export const FilterColumnSchema = z.custom<FilterColumn>(
  (val) =>
    typeof val === 'string' &&
    ((FILTER_COLUMNS as readonly string[]).includes(val) ||
      (val.startsWith(GP_PREFIX) && val.length > GP_PREFIX.length)),
  { message: 'Invalid filter column' },
);

export const QueryFilterSchema = z.object({
  id: z.string(),
  column: FilterColumnSchema,
  operator: z.enum(FILTER_OPERATORS),
  values: z.array(z.string()),
});

export type QueryFilter = z.infer<typeof QueryFilterSchema>;
export type FilterColumn = (typeof FILTER_COLUMNS)[number] | `gp.${string}`;
export type FilterOperator = (typeof FILTER_OPERATORS)[number];
