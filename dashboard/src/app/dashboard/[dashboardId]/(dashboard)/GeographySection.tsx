'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import LeafletMap from '@/components/LeafletMap';
import { getWorldMapData } from '@/app/actions/geography';
import { getCountryName } from '@/utils/countryCodes';
import { use } from 'react';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapData>;
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
          data: topCountries.map((country) => ({
            label: getCountryName(country.country_code),
            value: country.visitors,
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
