'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import LeafletMap from '@/components/LeafletMap';
import { getWorldMapDataAlpha3 } from '@/app/actions/geography';
import { getCountryName, alpha3ToAlpha2Code } from '@/utils/countryCodes';
import { use } from 'react';
import { FlagIcon, FlagIconProps } from '@/components/icons';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapDataAlpha3>;
};

export default function GeographySection({ worldMapPromise }: GeographySectionProps) {
  const worldMapData = use(worldMapPromise);

  const topCountries = worldMapData.visitorData.slice(0, 10) || [];

  return (
    <MultiProgressTable
      title='Geography'
      defaultTab='countries'
      tabs={[
        {
          key: 'countries',
          label: 'Top Countries',
          data: topCountries.map((country) => {
            const alpha2Code = alpha3ToAlpha2Code(country.country_code) || country.country_code;

            return {
              label: getCountryName(alpha2Code),
              value: country.visitors,
              icon: <FlagIcon countryCode={alpha2Code as FlagIconProps['countryCode']} />,
            };
          }),
          emptyMessage: 'No country data available',
        },
        {
          key: 'worldmap',
          label: 'World Map',
          data: [],
          emptyMessage: 'No world map data available',
          customContent: worldMapData ? (
            <div className='h-[280px] w-full'>
              <LeafletMap visitorData={worldMapData.visitorData} showZoomControls={false} />
            </div>
          ) : (
            <div className='text-muted-foreground py-12 text-center'>No world map data available</div>
          ),
        },
      ]}
    />
  );
}
