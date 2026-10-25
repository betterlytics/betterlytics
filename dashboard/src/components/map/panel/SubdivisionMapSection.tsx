'use client';

import LeafletMap from '@/components/map/LeafletMap';
import { MapProvider } from '@/components/map/MapProvider';
import { useRegionGeoJson } from '@/components/map/panel/use-region-geojson';
import { countryAsOneUnit } from '@/components/map/panel/country-unit';
import { createRegionDisplayResolver } from '@/components/map/panel/region-display';
import MapAttribution from '@/components/map/MapAttribution';
import { REGION_MAP_COUNTRIES } from '@/constants/regionCountries';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { QuerySection } from '@/components/QuerySection';
import GeographyLoading from '@/components/loading/GeographyLoading';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';

type SubdivisionMapSectionProps = {
  countryCode: string;
  regionCode: string | undefined;
  onRegionToggle: (regionCode: string) => void;
  onRegionClear: () => void;
};

export default function SubdivisionMapSection({
  countryCode,
  regionCode,
  onRegionToggle,
  onRegionClear,
}: SubdivisionMapSectionProps) {
  const { input, options } = useBAQueryParams();
  const hasRegionMap = REGION_MAP_COUNTRIES.has(countryCode);
  const regionQuery = trpc.geography.subdivisionMap.useQuery(
    { ...input, countryCode },
    {
      ...options,
      enabled: hasRegionMap,
      // Previous data only bridges a refetch of the same country, never another country's map
      placeholderData: (previous) =>
        previous?.visitorData.every((d) => d.code.startsWith(`${countryCode}-`)) ? previous : undefined,
    },
  );
  const countryQuery = trpc.geography.worldMap.useQuery(input, {
    ...options,
    enabled: !hasRegionMap,
    select: (data) => countryAsOneUnit(data, countryCode),
  });
  const query = hasRegionMap ? regionQuery : countryQuery;
  const geoJsonQuery = useRegionGeoJson(countryCode);
  const locale = useLocale();
  const t = useTranslations('components.geography');

  // A region id the file no longer carries would otherwise linger in the URL
  useEffect(() => {
    const features = geoJsonQuery.data?.features;
    if (regionCode && features && !features.some((feature) => feature.id === regionCode)) onRegionClear();
  }, [regionCode, geoJsonQuery.data, onRegionClear]);

  const resolveDisplay = useMemo(
    () => createRegionDisplayResolver(countryCode, geoJsonQuery.data, locale),
    [countryCode, geoJsonQuery.data, locale],
  );

  const selection = useMemo(
    () =>
      hasRegionMap
        ? { selectedId: regionCode ?? null, onToggle: onRegionToggle, onClear: onRegionClear }
        : undefined,
    [hasRegionMap, regionCode, onRegionToggle, onRegionClear],
  );

  if (geoJsonQuery.isError || geoJsonQuery.data === null) {
    return (
      <p className='text-muted-foreground px-4 pt-2 pb-4 text-sm'>
        {t(geoJsonQuery.isError ? 'regionLoadError' : 'noRegionalMap')}
      </p>
    );
  }

  return (
    <QuerySection
      query={query}
      fallback={
        <MapFrame>
          <GeographyLoading className='bg-transparent' />
        </MapFrame>
      }
      className='min-h-0 flex-1'
    >
      {(mapData) => (
        <MapFrame>
          {geoJsonQuery.data ? (
            // Keeps the panel map out of the toolbar's scope
            <MapProvider>
              <LeafletMap
                key={countryCode}
                {...mapData}
                geoJsonData={geoJsonQuery.data}
                resolveDisplay={resolveDisplay}
                selection={selection}
              >
                {geoJsonQuery.data.attribution && (
                  <MapAttribution {...geoJsonQuery.data.attribution} className='absolute right-2 bottom-2' />
                )}
              </LeafletMap>
            </MapProvider>
          ) : (
            <GeographyLoading className='bg-transparent' />
          )}
        </MapFrame>
      )}
    </QuerySection>
  );
}

function MapFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className='h-full px-4 pb-4'>
      <div className='h-[280px] w-full'>{children}</div>
    </div>
  );
}
