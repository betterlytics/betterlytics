import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SummaryCardsSkeleton } from '@/components/skeleton';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { fetchCoreWebVitalsSummaryAction, fetchCoreWebVitalSeriesAction } from '@/app/actions';
import InteractiveWebVitalsChartSection from './interactiveWebVitalsChartSection';

type PageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<{ filters: string }>;
};

export default async function WebVitalsPage({ params, searchParams }: PageParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate, queryFilters, granularity } =
    await BAFilterSearchParams.decodeFromParams(searchParams);

  const summaryPromise = fetchCoreWebVitalsSummaryAction(dashboardId, startDate, endDate, queryFilters);
  const seriesPromise = Promise.all([
    fetchCoreWebVitalSeriesAction(dashboardId, startDate, endDate, granularity, queryFilters, 'CLS'),
    fetchCoreWebVitalSeriesAction(dashboardId, startDate, endDate, granularity, queryFilters, 'LCP'),
    fetchCoreWebVitalSeriesAction(dashboardId, startDate, endDate, granularity, queryFilters, 'INP'),
    fetchCoreWebVitalSeriesAction(dashboardId, startDate, endDate, granularity, queryFilters, 'FCP'),
    fetchCoreWebVitalSeriesAction(dashboardId, startDate, endDate, granularity, queryFilters, 'TTFB'),
  ] as const);

  return (
    <div className='container space-y-6 p-6'>
      <DashboardFilters />
      <Suspense fallback={<SummaryCardsSkeleton />}>
        <InteractiveWebVitalsChartSection summaryPromise={summaryPromise} seriesPromise={seriesPromise} />
      </Suspense>
    </div>
  );
}
