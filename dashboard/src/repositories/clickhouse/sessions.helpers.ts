import { QueryFilter } from '@/entities/analytics/filter.entities';

const SESSION_TABLE_COLUMNS = new Set([
  'device_type',
  'country_code',
  'browser',
  'os',
  'referrer_source',
  'referrer_source_name',
  'referrer_url',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
]);

export function canUseSessionsTable(queryFilters: QueryFilter[]): boolean {
  return queryFilters.every((f) => SESSION_TABLE_COLUMNS.has(f.column));
}
