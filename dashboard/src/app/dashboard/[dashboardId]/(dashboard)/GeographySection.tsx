'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import LeafletMap from '@/components/LeafletMap';
import type { getTopCountryVisitsAction, getWorldMapDataAlpha2 } from '@/app/actions/geography';
import { getCountryName } from '@/utils/countryCodes';
import { use } from 'react';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapDataAlpha2>;
  topCountriesPromise: ReturnType<typeof getTopCountryVisitsAction>;
};

export default function GeographySection({ worldMapPromise, topCountriesPromise }: GeographySectionProps) {
  const worldMapData = use(worldMapPromise);
  const topCountries = use(topCountriesPromise);
  const { dictionary } = useDictionary();

  return (
    <MultiProgressTable
      title={dictionary.t('dashboard.sections.geography')}
      defaultTab='countries'
      tabs={[
        {
          key: 'countries',
          label: dictionary.t('dashboard.tabs.topCountries'),
          data: topCountries.map((country) => ({
            label: getCountryName(country.country_code),
            value: country.current.visitors,
            trendPercentage: country.change?.visitors,
            comparisonValue: country.compare?.visitors,
            icon: <FlagIcon countryCode={country.country_code as FlagIconProps['countryCode']} />,
          })),
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
