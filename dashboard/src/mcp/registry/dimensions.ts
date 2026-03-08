import { z } from 'zod';

export const DIMENSION_KEYS = [
  'url',
  'device_type',
  'country_code',
  'browser',
  'os',
  'custom_event_name',
  'referrer_source',
  'referrer_source_name',
] as const;
export type DimensionKey = (typeof DIMENSION_KEYS)[number];

type DimensionDefinition = {
  key: DimensionKey;
  column: string;
  description: string;
};

export const DIMENSIONS = [
  { key: 'url', column: 'url', description: 'Page URL' },
  { key: 'device_type', column: 'device_type', description: 'Desktop, mobile, or tablet' },
  { key: 'country_code', column: 'country_code', description: 'Two-letter ISO country code (e.g. US, DE, BR)' },
  { key: 'browser', column: 'browser', description: 'Browser name (e.g. Chrome, Firefox, Safari)' },
  { key: 'os', column: 'os', description: 'Operating system (e.g. Windows, macOS, iOS)' },
  { key: 'custom_event_name', column: 'custom_event_name', description: 'Custom event name' },
  { key: 'referrer_source', column: 'referrer_source', description: 'Traffic source type (e.g. search, social, direct)' },
  { key: 'referrer_source_name', column: 'referrer_source_name', description: 'Traffic source name (e.g. Google, Twitter, Reddit)' },
] satisfies DimensionDefinition[];

const DIMENSION_COLUMNS = DIMENSIONS.map((d) => d.column) as [string, ...string[]];
export const DimensionColumnSchema = z.enum(DIMENSION_COLUMNS);

export function getDimensionByKey(key: string): DimensionDefinition | undefined {
  return DIMENSIONS.find((d) => d.key === key);
}

export function validateDimensionColumn(column: string): string {
  return DimensionColumnSchema.parse(column);
}
