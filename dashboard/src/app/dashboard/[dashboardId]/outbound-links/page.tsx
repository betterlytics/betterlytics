import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import {
  fetchOutboundLinksAnalyticsAction,
  fetchOutboundLinksSummaryWithChartsAction,
  fetchOutboundClicksChartAction,
  fetchOutboundLinksDistributionAction,
} from '@/app/actions/outboundLinks';
import { TableSkeleton, ChartSkeleton } from '@/components/skeleton';
import OutboundLinksTableSection from './OutboundLinksTableSection';
import OutboundLinksChartSection from './OutboundLinksChartSection';
import OutboundLinksPieChart from './OutboundLinksPieChart';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { ActiveQueryFilters } from '@/components/filters/ActiveQueryFilters';

type OutboundLinksPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<{ filters: string }>;
};

export default async function OutboundLinksPage({ params, searchParams }: OutboundLinksPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate, granularity, queryFilters, compareStartDate, compareEndDate } =
    await BAFilterSearchParams.decodeFromParams(searchParams);

  const outboundLinksAnalyticsPromise = fetchOutboundLinksAnalyticsAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );

  const outboundClicksChartPromise = fetchOutboundClicksChartAction(
    dashboardId,
    startDate,
    endDate,
    granularity,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );

  const outboundLinksDistributionPromise = fetchOutboundLinksDistributionAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );

  return (
    <div className='container space-y-3 p-2 pt-4 sm:p-6'>
      <DashboardFilters />

      <ActiveQueryFilters />

      <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
        <Suspense fallback={<ChartSkeleton />}>
          <OutboundLinksPieChart distributionPromise={outboundLinksDistributionPromise} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <OutboundLinksChartSection outboundClicksChartPromise={outboundClicksChartPromise} />
        </Suspense>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <OutboundLinksTableSection outboundLinksAnalyticsPromise={outboundLinksAnalyticsPromise} />
      </Suspense>
    </div>
  );
}
