import { z } from 'zod';

type DimensionDefinition = {
  key: string;
  column: string;
  description: string;
};

const DimensionColumnSchema = z.enum([
  'url',
  'device_type',
  'country_code',
  'browser',
  'os',
  'custom_event_name',
]);

export const DIMENSIONS: DimensionDefinition[] = [
  { key: 'url', column: 'url', description: 'Page URL' },
  { key: 'device_type', column: 'device_type', description: 'Desktop, mobile, or tablet' },
  { key: 'country_code', column: 'country_code', description: 'Country code' },
  { key: 'browser', column: 'browser', description: 'Browser name' },
  { key: 'os', column: 'os', description: 'Operating system' },
  { key: 'custom_event_name', column: 'custom_event_name', description: 'Custom event name' },
];

export const DIMENSION_KEYS = DIMENSIONS.map((d) => d.key);

export function getDimensionByKey(key: string): DimensionDefinition | undefined {
  return DIMENSIONS.find((d) => d.key === key);
}

export function validateDimensionColumn(column: string): string {
  return DimensionColumnSchema.parse(column);
}
