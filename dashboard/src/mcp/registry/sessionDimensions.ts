import { z } from 'zod';
import type { SessionsTableSelectableColumn } from '@/lib/ba-session-query';

export const SESSION_DIMENSION_KEYS = [
  'entry_page',
  'exit_page',
  'device_type',
  'browser',
  'browser_version',
  'os',
  'os_version',
  'country_code',
  'subdivision_code',
  'city',
  'referrer_source',
  'referrer_source_name',
  'referrer_search_term',
  'referrer_url',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;
export type SessionDimensionKey = (typeof SESSION_DIMENSION_KEYS)[number];

type SessionDimensionDefinition = {
  key: SessionDimensionKey;
  column: SessionsTableSelectableColumn;
  description: string;
};

export const SESSION_DIMENSIONS = [
  {
    key: 'entry_page',
    column: 'entry_page',
    description: "Landing page: URL path of the session's first pageview",
  },
  { key: 'exit_page', column: 'exit_page', description: "URL path of the session's last pageview" },
  { key: 'device_type', column: 'device_type', description: 'Desktop, mobile, or tablet' },
  { key: 'browser', column: 'browser', description: 'Browser name (e.g. Chrome, Firefox, Safari)' },
  { key: 'browser_version', column: 'browser_version', description: 'Browser major version (e.g. 120)' },
  { key: 'os', column: 'os', description: 'Operating system (e.g. Windows, macOS, iOS)' },
  { key: 'os_version', column: 'os_version', description: 'Operating system major version (e.g. 10)' },
  { key: 'country_code', column: 'country_code', description: 'Two-letter ISO country code (e.g. US, DE, BR)' },
  {
    key: 'subdivision_code',
    column: 'subdivision_code',
    description: 'ISO 3166-2 subdivision (state/province) code',
  },
  { key: 'city', column: 'city', description: 'City name' },
  {
    key: 'referrer_source',
    column: 'referrer_source_effective',
    description: "Traffic source type of the session's first event (e.g. search, social, direct)",
  },
  {
    key: 'referrer_source_name',
    column: 'referrer_source_name',
    description: "Traffic source name of the session's first event (e.g. Google, Twitter, Reddit)",
  },
  {
    key: 'referrer_search_term',
    column: 'referrer_search_term',
    description: "Search term that brought the session's first event",
  },
  { key: 'referrer_url', column: 'referrer_url', description: "Full referrer URL of the session's first event" },
  { key: 'utm_source', column: 'utm_source', description: "UTM source of the session's first event" },
  { key: 'utm_medium', column: 'utm_medium', description: "UTM medium of the session's first event" },
  { key: 'utm_campaign', column: 'utm_campaign', description: "UTM campaign of the session's first event" },
  { key: 'utm_term', column: 'utm_term', description: "UTM term of the session's first event" },
  { key: 'utm_content', column: 'utm_content', description: "UTM content of the session's first event" },
] satisfies SessionDimensionDefinition[];

const SESSION_DIMENSION_COLUMNS = SESSION_DIMENSIONS.map((d) => d.column) as [
  SessionsTableSelectableColumn,
  ...SessionsTableSelectableColumn[],
];
const SessionDimensionColumnSchema = z.enum(SESSION_DIMENSION_COLUMNS);

export function getSessionDimensionByKey(key: string): SessionDimensionDefinition | undefined {
  return SESSION_DIMENSIONS.find((d) => d.key === key);
}

export function validateSessionDimensionColumn(column: string): SessionsTableSelectableColumn {
  return SessionDimensionColumnSchema.parse(column);
}
