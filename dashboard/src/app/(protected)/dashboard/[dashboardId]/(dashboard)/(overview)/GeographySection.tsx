'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import { getTopGeoVisitsAction } from '@/app/actions/analytics/geography.actions';
import { getWorldMapDataAlpha2 } from '@/app/actions/analytics/geography.actions';
import { getCountryName } from '@/utils/countryCodes';
import { getSubdivisionName } from '@/utils/subdivisionCodes';
import { useEffect, useState } from 'react';
import { FlagIcon, FlagIconProps } from '@/components/icons';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useFilterClick } from '@/hooks/use-filter-click';
import { GEO_LEVELS, type GeoLevel, type WorldMapResponse } from '@/entities/analytics/geography.entities';
import type { FilterColumn } from '@/entities/analytics/filter.entities';
import type { SupportedLanguages } from '@/constants/i18n';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import dynamic from 'next/dynamic';
import GeographyLoading from '@/components/loading/GeographyLoading';
import { useBAQuery } from '@/hooks/useBAQuery';
import { QuerySection } from '@/components/QuerySection';
import { TableSkeleton } from '@/components/skeleton';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), { ssr: false });

const GEO_LABEL_FORMATTERS: Record<GeoLevel, (value: string, locale: SupportedLanguages) => string> = {
  country_code: getCountryName,
  subdivision_code: getSubdivisionName,
  city: (value) => value,
};

function WorldMapContent({
  data,
  onLoad,
}: {
  data: WorldMapResponse | null;
  onLoad: (data: WorldMapResponse) => void;
}) {
  const dashboardId = useDashboardId();
  const query = useAnalyticsQuery();

  useEffect(() => {
    if (data !== null) return;
    getWorldMapDataAlpha2(dashboardId, query).then(onLoad);
  }, [dashboardId, query, data, onLoad]);

  return (
    <div className='h-[280px] w-full'>
      {data ? (
        <LeafletMap {...data} showZoomControls={false} initialZoom={1} />
      ) : (
        <GeographyLoading />
      )}
    </div>
  );
}

export default function GeographySection() {
  const query = useAnalyticsQuery();
  const [worldMapData, setWorldMapData] = useState<WorldMapResponse | null>(null);

  const countryQuery = useBAQuery({
    queryKey: ['geo-visits', 'country_code'],
    queryFn: (dashboardId, q) => getTopGeoVisitsAction(dashboardId, q, 'country_code'),
  });
  const subdivisionQuery = useBAQuery({
    queryKey: ['geo-visits', 'subdivision_code'],
    queryFn: (dashboardId, q) => getTopGeoVisitsAction(dashboardId, q, 'subdivision_code'),
  });
  const cityQuery = useBAQuery({
    queryKey: ['geo-visits', 'city'],
    queryFn: (dashboardId, q) => getTopGeoVisitsAction(dashboardId, q, 'city'),
  });

  const t = useTranslations('dashboard');
  const locale = useLocale();
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  useEffect(() => {
    setWorldMapData(null);
  }, [query]);

  if (countryQuery.isPending || subdivisionQuery.isPending || cityQuery.isPending) return <TableSkeleton />;

  const resolvedByLevel: Record<GeoLevel, Awaited<ReturnType<typeof getTopGeoVisitsAction>>> = {
    country_code: countryQuery.data!,
    subdivision_code: subdivisionQuery.data!,
    city: cityQuery.data!,
  };

  const geoLevelTabLabels = {
    country_code: t('tabs.countries'),
    subdivision_code: t('tabs.regions'),
    city: t('tabs.cities'),
  } satisfies Record<GeoLevel, string>;

  const geoLevelTabs = GEO_LEVELS.map((level) => ({
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

  const onItemClick = (tabKey: string, item: { key?: string }) => {
    if (item.key) makeFilterClick(tabKey as FilterColumn)(item.key);
  };

  return (
    <QuerySection loading={countryQuery.isFetching || subdivisionQuery.isFetching || cityQuery.isFetching}>
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
            customContent: (
              <WorldMapContent data={worldMapData} onLoad={setWorldMapData} />
            ),
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
