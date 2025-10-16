'use client';

import { use } from 'react';
import { getWorldMapGranularityTimeseries } from '@/app/actions/geography';
import { useTranslations } from 'next-intl';
import { DeckGLMapSelectionProvider } from '@/contexts/DeckGLSelectionContextProvider';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import dynamic from 'next/dynamic';
import DashboardLoading from '@/components/loading/DashboardLoading';
import { MapCommandProvider } from '@/contexts/DeckGLMapContext';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapGranularityTimeseries>;
};

export default function GeographySection({ worldMapPromise }: GeographySectionProps) {
  const mapData = use(worldMapPromise);
  const t = useTranslations('components.geography');

  const DynamicMapTimeseries = dynamic(() => import('@/components/map/deckgl/MapTimeseries'), {
    ssr: false,
    loading: () => <DashboardLoading title={t('loading')} subtitle={t('loadingMessage')} />,
  });

  return (
    <>
      <div className='h-full w-full'>
        <MapCommandProvider>
          <DeckGLMapSelectionProvider>
            <DynamicMapTimeseries visitorData={mapData} />
          </DeckGLMapSelectionProvider>
        </MapCommandProvider>
        <div className='fixed top-16 right-4 z-30'>
          <div className='bg-card flex gap-4 rounded-md p-2 shadow-md'>
            <DashboardFilters />
          </div>
        </div>
      </div>

      {mapData.data.length === 0 && (
        <div className='absolute right-4 bottom-4 rounded-md border border-amber-200 bg-amber-50 p-3 shadow-md'>
          <p className='text-sm text-amber-700'>{t('noData')}</p>
        </div>
      )}
    </>
  );
}
