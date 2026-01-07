import { Suspense } from 'react';
import {
  fetchPageAnalyticsAction,
  fetchEntryPageAnalyticsAction,
  fetchExitPageAnalyticsAction,
  fetchPagesSummaryWithChartsAction,
} from '@/app/actions/index.actions';
import { SummaryCardsSkeleton, TableSkeleton } from '@/components/skeleton';
import PagesSummarySection from './PagesSummarySection';
import PagesTableSection from './PagesTableSection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import type { FilterQuerySearchParams } from '@/entities/analytics/filterQueryParams.entities';
import { getUserTimezone } from '@/lib/cookies';

type PagesPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function PagesPage({ params, searchParams }: PagesPageParams) {
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const { startDate, endDate, granularity, queryFilters, compareStartDate, compareEndDate } =
    BAFilterSearchParams.decode(await searchParams, timezone);

  const pagesSummaryWithChartsPromise = fetchPagesSummaryWithChartsAction(
    dashboardId,
    startDate,
    endDate,
    granularity,
    queryFilters,
    timezone,
    compareStartDate,
    compareEndDate,
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
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('pages')}>
        <DashboardFilters />
      </DashboardHeader>

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
