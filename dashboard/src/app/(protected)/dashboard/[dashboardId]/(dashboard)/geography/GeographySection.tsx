'use client';

import { use } from 'react';
import { getWorldMapDataAlpha2 } from '@/app/actions/analytics/geography.actions';
import LeafletMap from '@/components/map/LeafletMap';
import { useTranslations } from 'next-intl';
import type { GeoLevelSetting } from '@/entities/dashboard/dashboardSettings.entities';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapDataAlpha2>;
  geoLevel: GeoLevelSetting;
};

export default function GeographySection({ worldMapPromise, geoLevel }: GeographySectionProps) {
  const mapData = use(worldMapPromise);
  const t = useTranslations('components.geography');

  if (geoLevel === 'OFF') {
    return (
      <div className='flex h-full w-full items-center justify-center'>
        <div className='rounded-md border border-amber-200 bg-amber-50 p-4 shadow-md'>
          <p className='text-sm text-amber-700'>{t('disabled')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='h-full w-full'>
        <LeafletMap {...mapData} showZoomControls={true} size='lg' />
      </div>

      {mapData.visitorData.length === 0 && (
        <div className='absolute right-4 bottom-4 rounded-md border border-amber-200 bg-amber-50 p-3 shadow-md'>
          <p className='text-sm text-amber-700'>{t('noData')}</p>
        </div>
      )}
    </>
  );
}
