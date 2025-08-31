'use client';

import { use } from 'react';
import { getWorldMapDataAlpha2, getWorldMapGranularityTimeseries } from '@/app/actions/geography';
import LeafletMap from '@/components/map/LeafletMap';
import { useTranslations } from 'next-intl';
import DeckGLMap from '@/components/map/DeckGLMap';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapDataAlpha2>;
  // worldMapTimeseries: ReturnType<typeof getWorldMapGranularityTimeseries>;
};

export default function GeographySection({ worldMapPromise }: GeographySectionProps) {
  const mapData = use(worldMapPromise);
  // const seriesData = use(worldMapTimeseries);
  const t = useTranslations('components.geography');

  return (
    <>
      <div className='h-full w-full'>
        <DeckGLMap visitorData={mapData.visitorData} maxVisitors={mapData.maxVisitors} />
      </div>

      {mapData.visitorData.length === 0 && (
        <div className='absolute right-4 bottom-4 rounded-md border border-amber-200 bg-amber-50 p-3 shadow-md'>
          <p className='text-sm text-amber-700'>{t('noData')}</p>
        </div>
      )}
    </>
  );
}
