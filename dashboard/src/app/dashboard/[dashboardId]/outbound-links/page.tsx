import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import {
  fetchOutboundLinksAnalyticsAction,
  fetchOutboundClicksChartAction,
  fetchOutboundLinksDistributionAction,
} from '@/app/actions/outboundLinks';
import { TableSkeleton, ChartSkeleton } from '@/components/skeleton';
import OutboundLinksTableSection from './OutboundLinksTableSection';
import OutboundLinksChartSection from './OutboundLinksChartSection';
import OutboundLinksPieChart from './OutboundLinksPieChart';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { getTranslations } from 'next-intl/server';

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
