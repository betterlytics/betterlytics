'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import { getTopGeoVisitsAction } from '@/app/actions/analytics/geography.actions';
import { getWorldMapDataAlpha2 } from '@/app/actions/analytics/geography.actions';
import { getCountryName } from '@/utils/countryCodes';
import { getSubdivisionName } from '@/utils/subdivisionCodes';
import { useState } from 'react';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useFilterClick } from '@/hooks/use-filter-click';
import { type GeoLevel } from '@/entities/analytics/geography.entities';
import type { FilterColumn } from '@/entities/analytics/filter.entities';
import type { SupportedLanguages } from '@/constants/i18n';
import dynamic from 'next/dynamic';
import { useBAQuery } from '@/hooks/useBAQuery';
import { QuerySection } from '@/components/QuerySection';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), { ssr: false });

const GEO_LABEL_FORMATTERS: Record<GeoLevel, (value: string, locale: SupportedLanguages) => string> = {
  country_code: getCountryName,
  subdivision_code: getSubdivisionName,
  city: (value) => value,
};

type GeographySectionProps = {
  enabledLevels: GeoLevel[];
};

export default function GeographySection({ enabledLevels }: GeographySectionProps) {
  const [activeTab, setActiveTab] = useState<string>(enabledLevels[0] ?? 'country_code');

  const countryQuery = useBAQuery({
    queryKey: ['geo-visits', 'country_code'],
    queryFn: (dashboardId, q) => getTopGeoVisitsAction(dashboardId, q, 'country_code'),
    enabled: enabledLevels.includes('country_code') && activeTab === 'country_code',
  });
  const subdivisionQuery = useBAQuery({
    queryKey: ['geo-visits', 'subdivision_code'],
    queryFn: (dashboardId, q) => getTopGeoVisitsAction(dashboardId, q, 'subdivision_code'),
    enabled: enabledLevels.includes('subdivision_code') && activeTab === 'subdivision_code',
  });
  const cityQuery = useBAQuery({
    queryKey: ['geo-visits', 'city'],
    queryFn: (dashboardId, q) => getTopGeoVisitsAction(dashboardId, q, 'city'),
    enabled: enabledLevels.includes('city') && activeTab === 'city',
  });
  const worldMapQuery = useBAQuery({
    queryKey: ['geo-worldmap'],
    queryFn: (dashboardId, q) => getWorldMapDataAlpha2(dashboardId, q),
    enabled: activeTab === 'worldmap',
  });

  const t = useTranslations('dashboard');
  const locale = useLocale();
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  const geoLevelTabLabels = {
    country_code: t('tabs.countries'),
    subdivision_code: t('tabs.regions'),
    city: t('tabs.cities'),
  } satisfies Record<GeoLevel, string>;

  const geoLevelTabs = enabledLevels.map((level) => {
    const queryForLevel = { country_code: countryQuery, subdivision_code: subdivisionQuery, city: cityQuery }[
      level
    ];
    const data = queryForLevel?.data;
    return {
      key: level,
      label: geoLevelTabLabels[level],
      loading: queryForLevel?.isFetching && !data,
      data: (data ?? []).map((item) => ({
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
    };
  });

  const activeQuery = { country_code: countryQuery, subdivision_code: subdivisionQuery, city: cityQuery, worldmap: worldMapQuery }[activeTab];

  const onItemClick = (tabKey: string, item: { key?: string }) => {
    if (item.key) makeFilterClick(tabKey as FilterColumn)(item.key);
  };

  return (
    <QuerySection loading={!!activeQuery?.isFetching && !!activeQuery?.data}>
      <MultiProgressTable
        title={t('sections.geography')}
        defaultTab={activeTab}
        onTabChange={setActiveTab}
        onItemClick={onItemClick}
        tabs={[
          ...geoLevelTabs,
          {
            key: 'worldmap',
            label: t('tabs.worldMap'),
            loading: worldMapQuery.isFetching && !worldMapQuery.data,
            data: [],
            customContent: worldMapQuery.data ? (
              <div className='h-[280px] w-full'>
                <LeafletMap {...worldMapQuery.data} showZoomControls={false} initialZoom={1} />
              </div>
            ) : undefined,
          },
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
    </QuerySection>
  );
}
