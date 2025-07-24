'use client';

import { use } from 'react';
import { getWorldMapData } from '@/app/actions/geography';
import LeafletMap from '@/components/LeafletMap';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapData>;
};

export default function GeographySection({ worldMapPromise }: GeographySectionProps) {
  const mapData = use(worldMapPromise);

  return (
    <>
      <div className='h-full w-full'>
        <LeafletMap visitorData={mapData.visitorData} maxVisitors={mapData.maxVisitors} showZoomControls={true} />
      </div>

      {mapData.visitorData.length === 0 && (
        <div className='absolute right-4 bottom-4 rounded-md border border-amber-200 bg-amber-50 p-3 shadow-md'>
          <p className='text-sm text-amber-700'>No geographic data available for the selected period</p>
        </div>
      )}
    </>
  );
}
