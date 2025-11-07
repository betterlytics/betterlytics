import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
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
  getTopCountryVisitsAction,
  getWorldMapDataAlpha2,
} from '@/app/actions';
import { fetchTrafficSourcesCombinedAction } from '@/app/actions/referrers';
import { fetchCustomEventsOverviewAction } from '@/app/actions/events';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';
import type { FilterQuerySearchParams } from '@/entities/filterQueryParams';
import { getUserTimezone } from '@/lib/cookies';

type DashboardPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function DashboardPage({ params, searchParams }: DashboardPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const { startDate, endDate, granularity, queryFilters, compareStartDate, compareEndDate } =
    BAFilterSearchParams.decode(await searchParams, timezone);

  const analyticsCombinedPromise = fetchPageAnalyticsCombinedAction(
    dashboardId,
    startDate,
    endDate,
    10,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );
  const worldMapPromise = getWorldMapDataAlpha2(dashboardId, { startDate, endDate, queryFilters });
  const topCountriesPromise = getTopCountryVisitsAction(dashboardId, {
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  });

  const summaryAndChartPromise = Promise.all([
    fetchSummaryStatsAction(
      dashboardId,
      startDate,
      endDate,
      granularity,
      queryFilters,
      timezone,
      compareStartDate,
      compareEndDate,
    ),
    fetchUniqueVisitorsAction(
      dashboardId,
      startDate,
      endDate,
      granularity,
      queryFilters,
      timezone,
      compareStartDate,
      compareEndDate,
    ),
    fetchTotalPageViewsAction(
      dashboardId,
      startDate,
      endDate,
      granularity,
      queryFilters,
      timezone,
      compareStartDate,
      compareEndDate,
    ),
    fetchSessionMetricsAction(
      dashboardId,
      startDate,
      endDate,
      granularity,
      queryFilters,
      timezone,
      compareStartDate,
      compareEndDate,
    ),
  ]);

  const devicePromise = fetchDeviceBreakdownCombinedAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );
  const trafficSourcesPromise = fetchTrafficSourcesCombinedAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    10,
    compareStartDate,
    compareEndDate,
  );
  const customEventsPromise = fetchCustomEventsOverviewAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );

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
          <GeographySection worldMapPromise={worldMapPromise} topCountriesPromise={topCountriesPromise} />
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
        <WeeklyHeatmapSection
          dashboardId={dashboardId}
          startDate={startDate}
          endDate={endDate}
          queryFilters={queryFilters}
        />
      </div>
    </div>
  );
}
