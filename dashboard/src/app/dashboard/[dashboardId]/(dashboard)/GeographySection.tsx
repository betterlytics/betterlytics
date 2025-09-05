'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import LeafletMap from '@/components/map/LeafletMap';
import type { getTopCountryVisitsAction, getWorldMapDataAlpha2 } from '@/app/actions/geography';
import { getCountryName } from '@/utils/countryCodes';
import { use } from 'react';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapDataAlpha2>;
  topCountriesPromise: ReturnType<typeof getTopCountryVisitsAction>;
};

export default function GeographySection({ worldMapPromise, topCountriesPromise }: GeographySectionProps) {
  const worldMapData = use(worldMapPromise);
  const topCountries = use(topCountriesPromise);
  const t = useTranslations('dashboard');
  const dashboardId = useDashboardId();
  const locale = useLocale();

  return (
    <MultiProgressTable
      title={t('sections.geography')}
      defaultTab='countries'
      tabs={[
        {
          key: 'countries',
          label: t('tabs.topCountries'),
          data: topCountries.map((country) => ({
            label: getCountryName(country.country_code, locale),
            value: country.current.visitors,
            trendPercentage: country.change?.visitors,
            comparisonValue: country.compare?.visitors,
            icon: (
              <FlagIcon
                countryCode={country.country_code as FlagIconProps['countryCode']}
                countryName={getCountryName(country.country_code, locale)}
              />
            ),
          })),
          emptyMessage: t('emptyStates.noCountryData'),
        },
        {
          key: 'worldmap',
          label: t('tabs.worldMap'),
          data: [],
          emptyMessage: t('emptyStates.noWorldMapData'),
          customContent: worldMapData ? (
            <div className='h-[280px] w-full'>
              <LeafletMap
                visitorData={worldMapData.visitorData}
                maxVisitors={worldMapData.maxVisitors}
                showZoomControls={false}
              />
            </div>
          ) : (
            <div className='text-muted-foreground py-12 text-center'>{t('emptyStates.noWorldMapData')}</div>
          ),
        },
      ]}
      footer={
        <FilterPreservingLink
          href={`/dashboard/${dashboardId}/geography`}
          className='text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline'
        >
          <span>{t('goTo', { section: t('sidebar.geography') })}</span>
          <ArrowRight className='h-3.5 w-3.5' />
        </FilterPreservingLink>
      }
    />
  );
}
