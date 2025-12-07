import { Suspense } from 'react';
import {
  fetchOutboundLinksAnalyticsAction,
  fetchOutboundClicksChartAction,
  fetchOutboundLinksDistributionAction,
} from '@/app/actions/analytics/outboundLinks.action';
import { TableSkeleton, ChartSkeleton } from '@/components/skeleton';
import OutboundLinksTableSection from './OutboundLinksTableSection';
import OutboundLinksChartSection from './OutboundLinksChartSection';
import OutboundLinksPieChart from './OutboundLinksPieChart';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';
import type { FilterQuerySearchParams } from '@/entities/analytics/filterQueryParams.entities';
import { getUserTimezone } from '@/lib/cookies';

type OutboundLinksPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function OutboundLinksPage({ params, searchParams }: OutboundLinksPageParams) {
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const { startDate, endDate, granularity, queryFilters, compareStartDate, compareEndDate } =
    BAFilterSearchParams.decode(await searchParams, timezone);

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
    timezone,
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
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('outboundLinks')}>
        <DashboardFilters />
      </DashboardHeader>

      <div className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
        <Suspense fallback={<ChartSkeleton />}>
          <OutboundLinksPieChart distributionPromise={outboundLinksDistributionPromise} />
        </Suspense>
        <div className='xl:col-span-2'>
          <Suspense fallback={<ChartSkeleton />}>
            <OutboundLinksChartSection outboundClicksChartPromise={outboundClicksChartPromise} />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <OutboundLinksTableSection outboundLinksAnalyticsPromise={outboundLinksAnalyticsPromise} />
      </Suspense>
    </div>
  );
}
