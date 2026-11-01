'use client';

import LeafletMap from '@/components/map/LeafletMap';
import MapLegend from '@/components/map/MapLegend';
import MapCard from '@/components/map/MapCard';
import MapZoomButtons from '@/components/map/MapZoomButtons';
import { MapProvider } from '@/components/map/MapProvider';
import { useSubdivisionDrilldown } from '@/components/map/panel/use-subdivision-drilldown';
import { useLgViewport } from '@/hooks/use-lg-viewport';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { QuerySection } from '@/components/QuerySection';
import GeographyLoading from '@/components/loading/GeographyLoading';

const SubdivisionDrilldown = dynamic(() => import('@/components/map/panel/SubdivisionDrilldown'), { ssr: false });

export default function GeographySection({ subdivisionsEnabled = false }: { subdivisionsEnabled?: boolean }) {
  const { input, options } = useBAQueryParams();
  const query = trpc.geography.worldMap.useQuery(input, options);
  const drilldown = useSubdivisionDrilldown();
  const isLgViewport = useLgViewport();
  const t = useTranslations('components.geography');
  const panelAvailable = subdivisionsEnabled && isLgViewport;
  // Panel docks bottom-right, so the map controls move left; CSS so the first paint already has the right corner
  const cornerClass = cn(
    'absolute right-2 bottom-2 items-end sm:right-4 sm:bottom-4',
    subdivisionsEnabled &&
      'lg:right-auto lg:left-[calc(var(--sidebar-offset)+1rem)] lg:items-start lg:transition-[left] lg:duration-200 lg:ease-linear',
  );

  const selection = useMemo(
    () =>
      subdivisionsEnabled
        ? {
            selectedId: drilldown.countryCode ?? null,
            onToggle: drilldown.toggleCountry,
            onClear: drilldown.clearCountry,
          }
        : undefined,
    [subdivisionsEnabled, drilldown.countryCode, drilldown.toggleCountry, drilldown.clearCountry],
  );

  return (
    <MapProvider>
      <QuerySection query={query} fallback={<GeographyLoading />} className='h-full w-full'>
        {(mapData) => (
          <div className='h-full w-full'>
            <LeafletMap {...mapData} size='lg' selection={selection}>
              <div className={cn('flex flex-col gap-2', cornerClass)}>
                <MapZoomButtons className='lg:fixed lg:top-16 lg:left-[calc(var(--sidebar-offset)+1rem)] lg:transition-[left] lg:duration-200 lg:ease-linear' />
                {mapData.visitorData.length > 0 ? (
                  <MapLegend maxVisitors={mapData.maxVisitors} />
                ) : (
                  <MapCard tone='warning' className='p-3'>
                    <p className='text-sm text-amber-700'>{t('noData')}</p>
                  </MapCard>
                )}
              </div>
            </LeafletMap>
          </div>
        )}
      </QuerySection>
      {panelAvailable && <SubdivisionDrilldown drilldown={drilldown} />}
    </MapProvider>
  );
}
