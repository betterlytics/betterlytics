import { type FilterColumn, type QueryFilter, type FilterOperator } from '@/entities/filter';

/**
 * Formats a Query Filter
 */
export function formatQueryFilter(filter: QueryFilter) {
  const column = COLUMN_PRETTY[filter.column];
  const operator = OPERATOR_PRETTY[filter.operator];
  const value = filter.value;

  return `${column} ${operator} ${value}`;
}

const COLUMN_PRETTY = {
  url: 'URL',
  device_type: 'Device',
  country_code: 'Country',
  browser: 'Browser',
  os: 'Operating system',
  referrer_source: 'Referrer source',
  referrer_source_name: 'Referrer name',
  referrer_search_term: 'Referrer term',
  referrer_url: 'Referrer URL',
  utm_source: 'UTM source',
  utm_medium: 'UTM medium',
  utm_campaign: 'UTM campaign',
  utm_term: 'UTM term',
  utm_content: 'UTM content',
  custom_event_name: 'Event',
  event_type: 'Type',
} satisfies Record<FilterColumn, string>;

const OPERATOR_PRETTY = {
  '=': 'is',
  '!=': 'is not',
} satisfies Record<FilterOperator, string>;
