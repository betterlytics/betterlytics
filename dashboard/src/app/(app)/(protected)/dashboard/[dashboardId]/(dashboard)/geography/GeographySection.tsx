'use client';

import LeafletMap from '@/components/map/LeafletMap';
import MapLegend from '@/components/map/MapLegend';
import { useTranslations } from 'next-intl';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { QuerySection } from '@/components/QuerySection';
import GeographyLoading from '@/components/loading/GeographyLoading';

export default function GeographySection() {
  const { input, options } = useBAQueryParams();
  const query = trpc.geography.worldMap.useQuery(input, options);
  const t = useTranslations('components.geography');

  return (
    <QuerySection query={query} fallback={<GeographyLoading />} className='h-full w-full'>
      {(mapData) => (
        <>
          <div className='h-full w-full'>
            <LeafletMap {...mapData} showZoomControls={true} size='lg'>
              <MapLegend
                maxVisitors={mapData.maxVisitors}
                className='absolute right-2 bottom-2 sm:right-4 sm:bottom-4'
              />
            </LeafletMap>
          </div>

          {mapData.visitorData.length === 0 && (
            <div className='absolute right-2 bottom-2 rounded-md border border-amber-200 bg-amber-50 p-3 shadow-md sm:right-4 sm:bottom-4'>
              <p className='text-sm text-amber-700'>{t('noData')}</p>
            </div>
          )}
        </>
      )}
    </QuerySection>
  );
}
