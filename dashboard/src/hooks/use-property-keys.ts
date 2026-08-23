'use client';

import { useFilterOptionsSource } from '@/components/filters/FilterOptionsSourceProvider';
import { type PropertyKeysBySource } from '@/entities/analytics/propertySources';

export function usePropertyKeys(input: { enabled: boolean } = { enabled: true }): PropertyKeysBySource {
  const { usePropertyKeysQuery } = useFilterOptionsSource();
  return usePropertyKeysQuery(input);
}
