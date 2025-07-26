'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import LeafletMap from '@/components/LeafletMap';
import { getWorldMapDataAlpha3 } from '@/app/actions/geography';
import { getCountryName, alpha3ToAlpha2Code } from '@/utils/countryCodes';
import { use } from 'react';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapDataAlpha3>;
};

export default function GeographySection({ worldMapPromise }: GeographySectionProps) {
  const worldMapData = use(worldMapPromise);
  const { dictionary } = useDictionary();

  const topCountries = worldMapData.visitorData.slice(0, 10) || [];

  return (
    <MultiProgressTable
      title={dictionary.t('dashboard.sections.geography')}
      defaultTab='countries'
      tabs={[
        {
          key: 'countries',
          label: dictionary.t('dashboard.tabs.topCountries'),
          data: topCountries.map((country) => {
            const alpha2Code = alpha3ToAlpha2Code(country.country_code) || country.country_code;

            return {
              label: getCountryName(alpha2Code),
              value: country.visitors,
              icon: <FlagIcon countryCode={alpha2Code as FlagIconProps['countryCode']} />,
            };
          }),
          emptyMessage: dictionary.t('dashboard.emptyStates.noCountryData'),
        },
        {
          key: 'worldmap',
          label: dictionary.t('dashboard.tabs.worldMap'),
          data: [],
          emptyMessage: dictionary.t('dashboard.emptyStates.noWorldMapData'),
          customContent: worldMapData ? (
            <div className='h-[280px] w-full'>
              <LeafletMap visitorData={worldMapData.visitorData} showZoomControls={false} />
            </div>
          ) : (
            <div className='text-muted-foreground py-12 text-center'>
              {dictionary.t('dashboard.emptyStates.noWorldMapData')}
            </div>
          ),
        },
      ]}
    />
  );
}
