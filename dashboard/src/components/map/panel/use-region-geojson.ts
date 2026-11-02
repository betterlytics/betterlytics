'use client';

import { useQuery } from '@tanstack/react-query';
import { REGION_MAP_COUNTRIES } from '@/constants/regionCountries';
import { regionGeoJsonUrl } from '@/constants/mapData';
import { fetchGeoJson, loadWorldGeoJson } from '@/components/map/map-assets';
import { countryOutline } from '@/components/map/panel/country-unit';
import type { RegionGeoJson } from '@/components/map/types';

// Falls back to the world outline; null when even that is missing
export function useRegionGeoJson(countryCode: string) {
  const hasRegionMap = REGION_MAP_COUNTRIES.has(countryCode);
  return useQuery({
    queryKey: ['region-geojson', countryCode],
    staleTime: Infinity,
    retry: 1,
    queryFn: async (): Promise<RegionGeoJson | null> =>
      hasRegionMap
        ? fetchGeoJson<RegionGeoJson>(regionGeoJsonUrl(countryCode))
        : countryOutline(await loadWorldGeoJson(), countryCode),
  });
}
