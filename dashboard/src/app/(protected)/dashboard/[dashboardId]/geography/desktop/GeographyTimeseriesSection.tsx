'use client';

import { use, useCallback } from 'react';
import { getWorldMapGranularityTimeseries } from '@/app/actions/geography';
import { useTranslations } from 'next-intl';
import { DeckGLMapSelectionProvider } from '@/contexts/DeckGLSelectionContextProvider';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import dynamic from 'next/dynamic';
import DashboardLoading from '@/components/loading/DashboardLoading';
import { MapCommandProvider } from '@/contexts/DeckGLMapContext';
import { useSearchParams } from 'next/navigation';
import { useBARouter } from '@/hooks/use-ba-router';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapGranularityTimeseries>;
};

export default function GeographyTimeseriesSection({ worldMapPromise }: GeographySectionProps) {
  const mapData = use(worldMapPromise);
  const t = useTranslations('components.geography');
  const searchParams = useSearchParams();
  const router = useBARouter();

  const DynamicMapTimeseries = dynamic(() => import('@/components/map/deckgl/MapTimeseries'), {
    ssr: false,
    loading: () => <DashboardLoading title={t('loading')} subtitle={t('loadingMessage')} />,
  });

  const viewTypeParam = searchParams?.get('viewType');
  const isTimeseries = viewTypeParam !== 'accumulated';

  const handleViewTypeChange = useCallback(
    (newIsTimeseries: boolean) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (newIsTimeseries) {
        params.delete('viewType');
      } else {
        params.set('viewType', 'accumulated');
      }

      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      router.replace(newUrl);
    },
    [searchParams, router],
  );

  return (
    <>
      <div className='h-full w-full'>
        <MapCommandProvider>
          <DeckGLMapSelectionProvider>
            <DynamicMapTimeseries visitorData={mapData} isTimeseries={isTimeseries} onViewTypeChange={handleViewTypeChange} />
          </DeckGLMapSelectionProvider>
        </MapCommandProvider>
        <div className='deckgl-controller fixed top-16 right-4 z-30'>
          <div className='flex flex-col justify-end gap-4'>
            <div className='bg-card flex gap-4 rounded-md p-2 shadow-md'>
              <DashboardFilters />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
