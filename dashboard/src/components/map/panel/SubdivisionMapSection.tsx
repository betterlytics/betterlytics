'use client';

import LeafletMap from '@/components/map/LeafletMap';
import MapZoomButtons from '@/components/map/MapZoomButtons';
import { MapProvider } from '@/components/map/MapProvider';
import { useRegionGeoJson } from '@/components/map/panel/use-region-geojson';
import { createRegionDisplayResolver } from '@/utils/regionDisplay';
import { REGION_MAP_COUNTRIES } from '@/constants/regionCountries';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { QuerySection } from '@/components/QuerySection';
import GeographyLoading from '@/components/loading/GeographyLoading';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

export default function SubdivisionMapSection({ countryCode }: { countryCode: string }) {
  const { input, options } = useBAQueryParams();
  const hasRegionMap = REGION_MAP_COUNTRIES.has(countryCode);
  const query = trpc.geography.subdivisionMap.useQuery(
    { ...input, countryCode },
    { ...options, enabled: hasRegionMap, placeholderData: undefined },
  );
  const geoJsonQuery = useRegionGeoJson(countryCode);
  const locale = useLocale();
  const t = useTranslations('components.geography');

  const resolveDisplay = useMemo(
    () => createRegionDisplayResolver(countryCode, geoJsonQuery.data, locale),
    [countryCode, geoJsonQuery.data, locale],
  );

  if (!hasRegionMap || geoJsonQuery.isError) {
    return (
      <p className='text-muted-foreground px-4 pt-2 pb-4 text-sm'>
        {t(hasRegionMap ? 'regionLoadError' : 'noRegionalMap')}
      </p>
    );
  }

  return (
    <QuerySection
      query={query}
      fallback={
        <div className='px-4 pb-4'>
          <div className='h-[280px] w-full'>
            <GeographyLoading className='bg-transparent' />
          </div>
        </div>
      }
      className='min-h-0 flex-1'
    >
      {(mapData) => (
        <div className='h-full px-4 pb-4'>
          <div className='h-[280px] w-full'>
            {geoJsonQuery.data ? (
              // Keeps the panel map out of the toolbar's scope
              <MapProvider>
                <LeafletMap
                  key={countryCode}
                  {...mapData}
                  geoJsonData={geoJsonQuery.data}
                  resolveDisplay={resolveDisplay}
                  fitBounds
                >
                  <MapZoomButtons className='absolute top-2.5 left-2.5' />
                </LeafletMap>
              </MapProvider>
            ) : (
              <GeographyLoading className='bg-transparent' />
            )}
          </div>
        </div>
      )}
    </QuerySection>
  );
}
