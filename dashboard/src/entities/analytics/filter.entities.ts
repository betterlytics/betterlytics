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
  'global_property',
] as const;

export const FILTER_OPERATORS = ['=', '!='] as const;

export const QueryFilterSchema = z.object({
  id: z.string(),
  column: z.enum(FILTER_COLUMNS),
  operator: z.enum(FILTER_OPERATORS),
  values: z.array(z.string()),
  propertyKey: z.string().optional(),
});

export type QueryFilter = z.infer<typeof QueryFilterSchema>;
export type FilterColumn = (typeof FILTER_COLUMNS)[number];
export type FilterOperator = (typeof FILTER_OPERATORS)[number];
