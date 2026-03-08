import { Suspense } from 'react';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { TableSkeleton, ChartSkeleton } from '@/components/skeleton';
import SummaryAndChartSection from './SummaryAndChartSection';
import PagesAnalyticsSection from './PagesAnalyticsSection';
import GeographySection from './GeographySection';
import DevicesSection from './DevicesSection';
import TrafficSourcesSection from './TrafficSourcesSection';
import CustomEventsSection from './CustomEventsSection';
import WeeklyHeatmapSection from './WeeklyHeatmapSection';
import {
  fetchDeviceBreakdownCombinedAction,
  fetchPageAnalyticsCombinedAction,
  fetchSessionMetricsAction,
  fetchSummaryStatsAction,
  fetchTotalPageViewsAction,
  fetchUniqueVisitorsAction,
  getTopGeoVisitsAction,
  getWorldMapDataAlpha2,
} from '@/app/actions/index.actions';
import type { GeoLevel } from '@/entities/analytics/geography.entities';
import { getAllowedGeoLevels } from '@/entities/analytics/geography.entities';
import { fetchTrafficSourcesCombinedAction } from '@/app/actions/analytics/referrers.actions';
import { fetchCustomEventsOverviewAction } from '@/app/actions/analytics/events.actions';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';
import type { FilterQuerySearchParams } from '@/entities/analytics/filterQueryParams.entities';
import { getUserTimezone } from '@/lib/cookies';
import { getDashboardSettings } from '@/services/dashboard/dashboardSettings.service';

type DashboardPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function DashboardPage({ params, searchParams }: DashboardPageParams) {
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const query = BAFilterSearchParams.decode(await searchParams, timezone);

  const settings = await getDashboardSettings(dashboardId);
  const allowedLevels = getAllowedGeoLevels(settings.geoLevel);

  const analyticsCombinedPromise = fetchPageAnalyticsCombinedAction(dashboardId, query, 10);

  const worldMapPromise = allowedLevels.includes('country_code')
    ? getWorldMapDataAlpha2(dashboardId, query)
    : Promise.resolve({ visitorData: [], compareData: [], maxVisitors: 0 });

  const topByGeoLevel: Partial<Record<GeoLevel, ReturnType<typeof getTopGeoVisitsAction>>> = {};
  for (const level of allowedLevels) {
    topByGeoLevel[level] = getTopGeoVisitsAction(dashboardId, query, level);
  }

  const summaryAndChartPromise = Promise.all([
    fetchSummaryStatsAction(dashboardId, query),
    fetchUniqueVisitorsAction(dashboardId, query),
    fetchTotalPageViewsAction(dashboardId, query),
    fetchSessionMetricsAction(dashboardId, query),
  ]);

  const devicePromise = fetchDeviceBreakdownCombinedAction(dashboardId, query);
  const trafficSourcesPromise = fetchTrafficSourcesCombinedAction(dashboardId, query, 10);
  const customEventsPromise = fetchCustomEventsOverviewAction(dashboardId, query);

  const t = await getTranslations('dashboard.sidebar');

  return (
    <div className='container space-y-4 p-2 sm:p-6'>
      <DashboardHeader title={t('overview')}>
        <DashboardFilters />
      </DashboardHeader>

      <Suspense fallback={<ChartSkeleton />}>
        <SummaryAndChartSection data={summaryAndChartPromise} />
      </Suspense>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <Suspense fallback={<TableSkeleton />}>
          <PagesAnalyticsSection analyticsCombinedPromise={analyticsCombinedPromise} />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <GeographySection worldMapPromise={worldMapPromise} topByGeoLevel={topByGeoLevel} geoLevel={settings.geoLevel} />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <DevicesSection deviceBreakdownCombinedPromise={devicePromise} />
        </Suspense>

        <Suspense fallback={<TableSkeleton />}>
          <TrafficSourcesSection trafficSourcesCombinedPromise={trafficSourcesPromise} />
        </Suspense>
        <Suspense fallback={<TableSkeleton />}>
          <CustomEventsSection customEventsPromise={customEventsPromise} />
        </Suspense>
        <WeeklyHeatmapSection dashboardId={dashboardId} />
      </div>
    </div>
  );
}
