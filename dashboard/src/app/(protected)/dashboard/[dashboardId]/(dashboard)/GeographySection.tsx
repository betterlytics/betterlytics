'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import LeafletMap from '@/components/map/LeafletMap';
import type { getTopCountryVisitsAction, getWorldMapDataAlpha2 } from '@/app/actions/geography';
import { getCountryName } from '@/utils/countryCodes';
import { use } from 'react';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useFilterClick } from '@/hooks/use-filter-click';

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
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  const onItemClick = (_tabKey: string, item: { key?: string; label: string }) => {
    if (item.key) return makeFilterClick('country_code')(item.key);
  };

  return (
    <MultiProgressTable
      title={t('sections.geography')}
      defaultTab='countries'
      onItemClick={onItemClick}
      tabs={[
        {
          key: 'countries',
          label: t('tabs.topCountries'),
          data: topCountries.map((country) => ({
            label: getCountryName(country.country_code, locale),
            key: country.country_code,
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
        },
        {
          key: 'worldmap',
          label: t('tabs.worldMap'),
          data: [],
          customContent: (
            <div className='h-[280px] w-full'>
              <LeafletMap {...worldMapData} showZoomControls={false} initialZoom={1} />
            </div>
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
