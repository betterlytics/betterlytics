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
import { ActiveQueryFilters } from '@/components/filters/ActiveQueryFilters';
import { getTranslations } from 'next-intl/server';

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

  const t = await getTranslations('dashboard.tabs');
  const tPages = await getTranslations('components.pages.table');

  return (
    <div className='container space-y-6 p-6'>
      <div className='flex flex-col justify-between gap-y-4 lg:flex-row lg:items-center'>
        <div>
          <h1 className='text-foreground mb-1 text-2xl font-bold'>{t('pages')}</h1>
          <p className='text-muted-foreground text-sm'>{tPages('description')}</p>
        </div>
        <DashboardFilters />
      </div>

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
