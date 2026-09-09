'use client';

import { useQuery } from '@tanstack/react-query';
import { REGION_MAP_COUNTRIES } from '@/constants/regionCountries';
import type { RegionGeoJson } from '@/components/map/types';

export function useRegionGeoJson(countryCode: string) {
  return useQuery({
    queryKey: ['region-geojson', countryCode],
    enabled: REGION_MAP_COUNTRIES.has(countryCode),
    staleTime: Infinity,
    retry: 1,
    queryFn: async (): Promise<RegionGeoJson> => {
      const res = await fetch(`/data/regions/${countryCode}.geo.json`);
      if (!res.ok) {
        throw new Error(`Failed to load region geojson for ${countryCode} (${res.status})`);
      }
      return res.json();
    },
  });
}
