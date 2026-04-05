'use client';

import { getWorldMapDataAlpha2 } from '@/app/actions/analytics/geography.actions';
import LeafletMap from '@/components/map/LeafletMap';
import { useTranslations } from 'next-intl';
import { useBASuspenseQuery } from '@/hooks/useBASuspenseQuery';

export default function GeographySection() {
  const { data: mapData } = useBASuspenseQuery({
    queryKey: ['world-map'],
    queryFn: (dashboardId, query) => getWorldMapDataAlpha2(dashboardId, query),
  });
  const t = useTranslations('components.geography');

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
