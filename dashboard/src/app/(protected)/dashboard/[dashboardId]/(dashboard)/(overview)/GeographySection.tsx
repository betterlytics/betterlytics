'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import type { getTopGeoVisitsAction } from '@/app/actions/analytics/geography.actions';
import { getWorldMapDataAlpha2 } from '@/app/actions/analytics/geography.actions';
import { getCountryName } from '@/utils/countryCodes';
import { getSubdivisionName } from '@/utils/subdivisionCodes';
import { use, useEffect, useMemo, useState } from 'react';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useFilterClick } from '@/hooks/use-filter-click';
import { GEO_LEVELS, type GeoLevel, type WorldMapResponse } from '@/entities/analytics/geography.entities';
import type { FilterColumn } from '@/entities/analytics/filter.entities';
import type { SupportedLanguages } from '@/constants/i18n';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import GeographyLoading from '@/components/loading/GeographyLoading';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), { ssr: false });

type GeoTablePromise = ReturnType<typeof getTopGeoVisitsAction>;

type GeographySectionProps = {
  topByGeoLevel: Record<GeoLevel, GeoTablePromise>;
};

const GEO_LABEL_FORMATTERS: Record<GeoLevel, (value: string, locale: SupportedLanguages) => string> = {
  country_code: getCountryName,
  subdivision_code: getSubdivisionName,
  city: (value) => value,
};

function WorldMapContent({ dashboardId }: { dashboardId: string }) {
  const query = useAnalyticsQuery();
  const [worldMapData, setWorldMapData] = useState<WorldMapResponse | null>(null);

  useEffect(() => {
    getWorldMapDataAlpha2(dashboardId, query).then(setWorldMapData);
  }, [dashboardId, query]);

  return (
    <div className='h-[280px] w-full'>
      {worldMapData ? (
        <LeafletMap {...worldMapData} showZoomControls={false} initialZoom={1} />
      ) : (
        <GeographyLoading />
      )}
    </div>
  );
}

export default function GeographySection({ topByGeoLevel }: GeographySectionProps) {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const countryData = use(topByGeoLevel.country_code);
  const subdivisionData = use(topByGeoLevel.subdivision_code);
  const cityData = use(topByGeoLevel.city);
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  const resolvedByLevel = useMemo<Record<GeoLevel, Awaited<GeoTablePromise>>>(
    () => ({
      country_code: countryData,
      subdivision_code: subdivisionData,
      city: cityData,
    }),
    [countryData, subdivisionData, cityData],
  );

  const geoLevelTabs = useMemo(() => {
    const geoLevelTabLabels = {
      country_code: t('tabs.countries'),
      subdivision_code: t('tabs.regions'),
      city: t('tabs.cities'),
    } satisfies Record<GeoLevel, string>;

    return GEO_LEVELS.map((level) => ({
      key: level,
      label: geoLevelTabLabels[level],
      data: resolvedByLevel[level].map((item) => ({
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
  }, [resolvedByLevel, t, locale]);

  const onItemClick = (tabKey: string, item: { key?: string }) => {
    if (item.key) makeFilterClick(tabKey as FilterColumn)(item.key);
  };

  return (
    <MultiProgressTable
      title={t('sections.geography')}
      defaultTab={geoLevelTabs[0]?.key ?? 'worldmap'}
      onItemClick={onItemClick}
      tabs={[
        ...geoLevelTabs,
        {
          key: 'worldmap',
          label: t('tabs.worldMap'),
          data: [],
          customContent: <WorldMapContent dashboardId={dashboardId} />,
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
  );
}
