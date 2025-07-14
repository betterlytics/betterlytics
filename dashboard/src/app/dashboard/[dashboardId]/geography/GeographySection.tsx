'use client';

import { use } from 'react';
import { getWorldMapData } from '@/app/actions/geography';
import LeafletMap from '@/components/LeafletMap';
import { alpha2ToAlpha3Code } from '@/utils/countryCodes';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapData>;
};

export default function GeographySection({ worldMapPromise }: GeographySectionProps) {
  const mapData = use(worldMapPromise);

  // Convert alpha-2 country codes to alpha-3 for map compatibility with the current geojson data format
  const processedVisitorData = mapData.visitorData.map((visitor) => {
    if (visitor.country_code === 'Localhost') {
      return visitor;
    }

    const alpha3 = alpha2ToAlpha3Code(visitor.country_code);

    return alpha3
      ? {
          ...visitor,
          country_code: alpha3,
        }
      : visitor;
  });

  return (
    <>
      <div className='h-full w-full'>
        <LeafletMap visitorData={processedVisitorData} maxVisitors={mapData.maxVisitors} showZoomControls={true} />
      </div>

      {processedVisitorData.length === 0 && (
        <div className='absolute right-4 bottom-4 rounded-md border border-amber-200 bg-amber-50 p-3 shadow-md'>
          <p className='text-sm text-amber-700'>No geographic data available for the selected period</p>
        </div>
      )}
    </>
  );
}
