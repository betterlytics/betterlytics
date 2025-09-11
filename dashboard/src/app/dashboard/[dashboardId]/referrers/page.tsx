import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
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
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

type ReferrersPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<{ filters: string }>;
};

export default async function ReferrersPage({ params, searchParams }: ReferrersPageParams) {
  const session = await getServerSession(authOptions);

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
    granularity,
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
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('referrers')}>
        <DashboardFilters />
      </DashboardHeader>
      <Suspense fallback={<SummaryCardsSkeleton count={4} />}>
        <ReferrersSummarySection referrerSummaryWithChartsPromise={referrerSummaryWithChartsPromise} />
      </Suspense>
      <Suspense
        fallback={
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
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
