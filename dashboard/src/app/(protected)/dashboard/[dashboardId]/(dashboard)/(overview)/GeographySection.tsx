'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import LeafletMap from '@/components/map/LeafletMap';
import type { getTopGeoVisitsAction, getWorldMapDataAlpha2 } from '@/app/actions/analytics/geography.actions';
import { getCountryName } from '@/utils/countryCodes';
import { getSubdivisionName } from '@/utils/subdivisionCodes';
import { use } from 'react';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useFilterClick } from '@/hooks/use-filter-click';
import { GEO_LEVELS, type GeoLevel } from '@/entities/analytics/geography.entities';
import type { FilterColumn } from '@/entities/analytics/filter.entities';
import type { SupportedLanguages } from '@/constants/i18n';

type GeoTablePromise = ReturnType<typeof getTopGeoVisitsAction>;

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapDataAlpha2>;
  topByGeoLevel: Partial<Record<GeoLevel, GeoTablePromise>>;
};

const GEO_LABEL_FORMATTERS: Record<GeoLevel, (code: string, locale: SupportedLanguages) => string> = {
  country_code: getCountryName,
  subdivision_code: getSubdivisionName,
  city: (code) => code,
};

export default function GeographySection({ worldMapPromise, topByGeoLevel }: GeographySectionProps) {
  const worldMapData = use(worldMapPromise);
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  const geoLevelTabLabels = {
    country_code: t('tabs.countries'),
    subdivision_code: t('tabs.regions'),
    city: t('tabs.cities'),
  } satisfies Record<GeoLevel, string>;

  const geoLevelTabs = GEO_LEVELS.map((level) => {
    const data = topByGeoLevel[level] ? use(topByGeoLevel[level]) : [];
    return { level, data };
  }).map(({ level, data }) => ({
    key: level,
    label: geoLevelTabLabels[level],
    data: data.map((item) => ({
      label: GEO_LABEL_FORMATTERS[level](item[level], locale),
      key: item[level],
      value: item.current.visitors,
      trendPercentage: item.change?.visitors,
      comparisonValue: item.compare?.visitors,
      icon: (
        <FlagIcon
          countryCode={item.current.country_code as FlagIconProps['countryCode']}
          countryName={getCountryName(item.current.country_code, locale)}
        />
      ),
    })),
  }));

  const onItemClick = (tabKey: string, item: { key?: string }) => {
    if (item.key) makeFilterClick(tabKey as FilterColumn)(item.key);
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
        ...geoLevelTabs,
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
