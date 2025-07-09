"use client";
import MultiProgressTable from '@/components/MultiProgressTable';
import LeafletMap from '@/components/LeafletMap';
import { getWorldMapData } from "@/app/actions/geography";
import { alpha3ToAlpha2Code, getCountryName } from "@/utils/countryCodes";
import { use } from 'react';
import { GeoVisitor } from '@/entities/geography';
import { FlagIcon, FlagIconProps } from '@/components/icons';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapData>;
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
            const alpha2 = country.country_code ? alpha3ToAlpha2Code(country.country_code) : undefined;
          
            return {
              label: getCountryName(alpha2 ?? 'Localhost'),
              value: country.visitors,
              icon: alpha2 ? <FlagIcon countryCode={alpha2 as FlagIconProps['countryCode']} /> : undefined,
            };
          }),
          emptyMessage: 'No country data available',
        },
        {
          key: 'worldmap',
          label: 'World Map',
          data: [],
          emptyMessage: 'No world map data available',
          customContent: topCountries ? (
            <div className='h-[280px] w-full'>
              <LeafletMap visitorData={topCountries} showZoomControls={false} />
            </div>
          ) : (
            <div className='text-muted-foreground py-12 text-center'>No world map data available</div>
          ),
        },
      ]}
    />
  );
} 