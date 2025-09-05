import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import {
  fetchPageAnalyticsAction,
  fetchEntryPageAnalyticsAction,
  fetchExitPageAnalyticsAction,
  fetchPagesSummaryWithChartsAction,
} from '@/app/actions';
import { SummaryCardsSkeleton, TableSkeleton } from '@/components/skeleton';
import PagesSummarySection from '@/app/dashboard/[dashboardId]/pages/PagesSummarySection';
import PagesTableSection from './PagesTableSection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';

type PagesPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<{ filters: string }>;
};

export default async function PagesPage({ params, searchParams }: PagesPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate, queryFilters, compareStartDate, compareEndDate } =
    await BAFilterSearchParams.decodeFromParams(searchParams);

  const pagesSummaryWithChartsPromise = fetchPagesSummaryWithChartsAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
  );
  const pageAnalyticsPromise = fetchPageAnalyticsAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );
  const entryPageAnalyticsPromise = fetchEntryPageAnalyticsAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );
  const exitPageAnalyticsPromise = fetchExitPageAnalyticsAction(
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

      <Suspense fallback={<SummaryCardsSkeleton />}>
        <PagesSummarySection pagesSummaryWithChartsPromise={pagesSummaryWithChartsPromise} />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <PagesTableSection
          pageAnalyticsPromise={pageAnalyticsPromise}
          entryPageAnalyticsPromise={entryPageAnalyticsPromise}
          exitPageAnalyticsPromise={exitPageAnalyticsPromise}
        />
      </Suspense>
    </div>
  );
}
