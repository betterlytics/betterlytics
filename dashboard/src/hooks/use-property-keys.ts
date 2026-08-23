'use client';

import { useFilterOptionsSource } from '@/components/filters/FilterOptionsSourceProvider';
import { type PropertyKeysBySource } from '@/entities/analytics/propertySources';

export function usePropertyKeys(): PropertyKeysBySource {
  const { usePropertyKeysQuery } = useFilterOptionsSource();
  return usePropertyKeysQuery();
}
