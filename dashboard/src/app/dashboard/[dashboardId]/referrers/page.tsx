import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { Suspense } from 'react';
import {
  fetchReferrerSourceAggregationDataForSite,
  fetchReferrerSummaryWithChartsDataForSite,
  fetchReferrerTableDataForSite,
  fetchReferrerTrafficTrendBySourceDataForSite,
} from '@/app/actions';
import { SummaryCardsSkeleton, TableSkeleton, ChartSkeleton } from '@/components/skeleton';
import ReferrersSummarySection from './ReferrersSummarySection';
import ReferrersChartsSection from './ReferrersChartsSection';
import ReferrersTableSection from './ReferrersTableSection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';

type ReferrersPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<{ filters: string }>;
};

export default async function ReferrersPage({ params, searchParams }: ReferrersPageParams) {
  const session = await getServerSession(getAuthOptions());

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate, granularity, queryFilters, compareStartDate, compareEndDate } =
    await BAFilterSearchParams.decodeFromParams(searchParams);

  const referrerSummaryWithChartsPromise = fetchReferrerSummaryWithChartsDataForSite(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
  );
  const distributionPromise = fetchReferrerSourceAggregationDataForSite(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );
  const trendPromise = fetchReferrerTrafficTrendBySourceDataForSite(
    dashboardId,
    startDate,
    endDate,
    granularity,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );
  const tablePromise = fetchReferrerTableDataForSite(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    100,
    compareStartDate,
    compareEndDate,
  );

  return (
    <div className='container space-y-6 p-6'>
      <div className='flex flex-col justify-between gap-y-4 lg:flex-row lg:items-center'>
        <div>
          <h1 className='text-foreground mb-1 text-2xl font-bold'>Referrers</h1>
          <p className='text-muted-foreground text-sm'>Analytics and insights for your website</p>
        </div>
        <DashboardFilters />
      </div>

      <Suspense fallback={<SummaryCardsSkeleton count={4} />}>
        <ReferrersSummarySection referrerSummaryWithChartsPromise={referrerSummaryWithChartsPromise} />
      </Suspense>

      <Suspense
        fallback={
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        }
      >
        <ReferrersChartsSection distributionPromise={distributionPromise} trendPromise={trendPromise} />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <ReferrersTableSection referrerTablePromise={tablePromise} />
      </Suspense>
    </div>
  );
}
