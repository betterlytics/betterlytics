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
import { NoDataBanner } from '@/app/dashboard/[dashboardId]/NoDataBanner';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';

type DashboardPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<{ filters: string }>;
};

export default async function DashboardPage({ params, searchParams }: DashboardPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }
  const { dashboardId } = await params;
  const { startDate, endDate, granularity, queryFilters, compareStartDate, compareEndDate } =
    await BAFilterSearchParams.decodeFromParams(searchParams);

  const analyticsCombinedPromise = fetchPageAnalyticsCombinedAction(
    dashboardId,
    startDate,
    endDate,
    5,
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
    fetchSummaryStatsAction(dashboardId, startDate, endDate, queryFilters),
    fetchUniqueVisitorsAction(
      dashboardId,
      startDate,
      endDate,
      granularity,
      queryFilters,
      compareStartDate,
      compareEndDate,
    ),
    fetchTotalPageViewsAction(
      dashboardId,
      startDate,
      endDate,
      granularity,
      queryFilters,
      compareStartDate,
      compareEndDate,
    ),
    fetchSessionMetricsAction(
      dashboardId,
      startDate,
      endDate,
      granularity,
      queryFilters,
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
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('overview')}>
        <DashboardFilters />
      </DashboardHeader>

      <Suspense>
        <NoDataBanner />
      </Suspense>

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
