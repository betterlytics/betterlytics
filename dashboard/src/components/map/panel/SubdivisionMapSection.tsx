'use client';

import LeafletMap from '@/components/map/LeafletMap';
import RegionList from './RegionList';
import { useRegionGeoJson } from './use-region-geojson';
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
  const query = trpc.geography.subdivisionMap.useQuery({ ...input, countryCode }, options);
  const geoJsonQuery = useRegionGeoJson(countryCode);
  const locale = useLocale();
  const t = useTranslations('components.geography');

  const showMap = REGION_MAP_COUNTRIES.has(countryCode) && !geoJsonQuery.isError;

  const resolveDisplay = useMemo(
    () => createRegionDisplayResolver(countryCode, geoJsonQuery.data, locale),
    [countryCode, geoJsonQuery.data, locale],
  );

  return (
    <QuerySection query={query} fallback={<GeographyLoading />} className='flex-1 overflow-y-auto px-4 pb-4'>
      {(mapData) => (
        <div className='space-y-4'>
          {showMap ? (
            <div className='h-[280px] w-full'>
              {geoJsonQuery.data ? (
                <LeafletMap
                  key={countryCode}
                  {...mapData}
                  geoJsonData={geoJsonQuery.data}
                  resolveDisplay={resolveDisplay}
                  fitBounds
                  showZoomControls
                  showLegend={false}
                  interactionConfig={{
                    dragging: true,
                    scrollWheelZoom: false,
                    doubleClickZoom: true,
                    touchZoom: true,
                  }}
                />
              ) : (
                <GeographyLoading />
              )}
            </div>
          ) : (
            <p className='text-muted-foreground py-2 text-sm'>{t('noRegionalMap')}</p>
          )}
          <RegionList
            regions={mapData.visitorData}
            maxVisitors={mapData.maxVisitors}
            resolveDisplay={resolveDisplay}
          />
        </div>
      )}
    </QuerySection>
  );
}
