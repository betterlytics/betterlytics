'use client';

import { use } from 'react';
import { getWorldMapDataAlpha2 } from '@/app/actions/geography';
import LeafletMap from '@/components/map/LeafletMap';
import { useTranslations } from 'next-intl';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapDataAlpha2>;
};

export default function GeographySection({ worldMapPromise }: GeographySectionProps) {
  const mapData = use(worldMapPromise);
  const t = useTranslations('components.geography');

  return (
    <>
      <div className='h-full w-full'>
        <LeafletMap
          visitorData={mapData.visitorData}
          maxVisitors={mapData.maxVisitors}
          showZoomControls={true}
          size='lg'
        />
      </div>

      {mapData.visitorData.length === 0 && (
        <div className='absolute right-4 bottom-4 rounded-md border border-amber-200 bg-amber-50 p-3 shadow-md'>
          <p className='text-sm text-amber-700'>{t('noData')}</p>
        </div>
      )}
    </>
  );
}
