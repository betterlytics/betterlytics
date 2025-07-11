'use client';

import { use } from 'react';
import { getWorldMapData } from '@/app/actions/geography';
import LeafletMap from '@/components/LeafletMap';
import { alpha2ToAlpha3Code } from '@/utils/countryCodes';
import { GeoVisitor } from '@/entities/geography';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapData>;
};

const mockGeographyData: GeoVisitor[] = [
  { country_code: 'USA', visitors: 1247 },
  { country_code: 'GBR', visitors: 892 },
  { country_code: 'DNK', visitors: 743 },
  { country_code: 'FRA', visitors: 621 },
  { country_code: 'CAN', visitors: 534 },
  { country_code: 'AUS', visitors: 398 },
  { country_code: 'JPN', visitors: 287 },
  { country_code: 'BRA', visitors: 234 },
  { country_code: 'IND', visitors: 198 },
  { country_code: 'ESP', visitors: 156 },
  { country_code: 'ITA', visitors: 134 },
  { country_code: 'NLD', visitors: 98 },
  { country_code: 'SWE', visitors: 67 },
  { country_code: 'NOR', visitors: 45 },
];

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
        <LeafletMap visitorData={mockGeographyData} maxVisitors={1247} showZoomControls={true} />
      </div>

      {processedVisitorData.length === 0 && (
        <div className='absolute right-4 bottom-4 z-[1000] rounded-md border border-amber-200 bg-amber-50 p-3 shadow-md'>
          <p className='text-sm text-amber-700'>No geographic data available for the selected period</p>
        </div>
      )}
    </>
  );
}
