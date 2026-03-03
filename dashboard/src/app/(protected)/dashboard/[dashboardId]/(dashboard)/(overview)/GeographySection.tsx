'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import LeafletMap from '@/components/map/LeafletMap';
import type {
  getTopCityVisitsAction,
  getTopCountryVisitsAction,
  getTopSubdivisionVisitsAction,
  getWorldMapDataAlpha2,
} from '@/app/actions/analytics/geography.actions';
import { getCountryName } from '@/utils/countryCodes';
import { getSubdivisionName } from '@/utils/subdivisionCodes';
import { use } from 'react';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useFilterClick } from '@/hooks/use-filter-click';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapDataAlpha2>;
  topCountriesPromise: ReturnType<typeof getTopCountryVisitsAction>;
  topSubdivisionsPromise: ReturnType<typeof getTopSubdivisionVisitsAction>;
  topCitiesPromise: ReturnType<typeof getTopCityVisitsAction>;
};

export default function GeographySection({
  worldMapPromise,
  topCountriesPromise,
  topSubdivisionsPromise,
  topCitiesPromise,
}: GeographySectionProps) {
  const worldMapData = use(worldMapPromise);
  const topCountries = use(topCountriesPromise);
  const topSubdivisions = use(topSubdivisionsPromise);
  const topCities = use(topCitiesPromise);
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  const onItemClick = (tabKey: string, item: { key?: string; label: string }) => {
    if (!item.key) return;
    if (tabKey === 'cities') return makeFilterClick('city')(item.key);
    if (tabKey === 'regions') return makeFilterClick('subdivision_code')(item.key);
    return makeFilterClick('country_code')(item.key);
  };

  const renderFlag = (countryCode: string | undefined) => {
    if (!countryCode) return undefined;
    return (
      <FlagIcon
        countryCode={countryCode as FlagIconProps['countryCode']}
        countryName={getCountryName(countryCode, locale)}
      />
    );
  };

  return (
    <MultiProgressTable
      title={t('sections.geography')}
      defaultTab='worldmap'
      onItemClick={onItemClick}
      tabs={[
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
        {
          key: 'countries',
          label: t('tabs.countries'),
          data: topCountries.map((country) => ({
            label: getCountryName(country.code, locale),
            key: country.code,
            value: country.current.visitors,
            trendPercentage: country.change?.visitors,
            comparisonValue: country.compare?.visitors,
            icon: renderFlag(country.code),
          })),
        },
        ...(topSubdivisions.length > 0
          ? [
              {
                key: 'regions',
                label: t('tabs.regions'),
                data: topSubdivisions.map((subdivision) => ({
                  label: getSubdivisionName(subdivision.code, locale),
                  key: subdivision.code,
                  value: subdivision.current.visitors,
                  trendPercentage: subdivision.change?.visitors,
                  comparisonValue: subdivision.compare?.visitors,
                  icon: renderFlag(subdivision.current.countryCode),
                })),
              },
            ]
          : []),
        ...(topCities.length > 0
          ? [
              {
                key: 'cities',
                label: t('tabs.cities'),
                data: topCities.map((city) => ({
                  label: city.code,
                  key: city.code,
                  value: city.current.visitors,
                  trendPercentage: city.change?.visitors,
                  comparisonValue: city.compare?.visitors,
                  icon: renderFlag(city.current.countryCode),
                })),
              },
            ]
          : []),
      ]}
      footer={
        <FilterPreservingLink
          href='geography'
          className='text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline'
        >
          <span>{t('goTo', { section: t('sidebar.geography') })}</span>
          <ArrowRight className='h-3.5 w-3.5' />
        </FilterPreservingLink>
      }
    />
  );
}
