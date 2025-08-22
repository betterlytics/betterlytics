import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SummaryCardsSkeleton } from '@/components/skeleton';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import {
  fetchCoreWebVitalsSummaryAction,
  fetchCoreWebVitalChartDataAction,
  fetchCoreWebVitalsByDimensionAction,
} from '@/app/actions';
import InteractiveWebVitalsChartSection from './interactiveWebVitalsChartSection';
import WebVitalsTableSection from './webVitalsTableSection';

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
  const seriesPromise = fetchCoreWebVitalChartDataAction(
    dashboardId,
    startDate,
    endDate,
    granularity,
    queryFilters,
  );
  const perPagePromise = fetchCoreWebVitalsByDimensionAction(dashboardId, startDate, endDate, queryFilters, 'url');
  const perDevicePromise = fetchCoreWebVitalsByDimensionAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    'device_type',
  );
  const perCountryPromise = fetchCoreWebVitalsByDimensionAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    'country_code',
  );

  return (
    <div className='container space-y-6 p-6'>
      <DashboardFilters />
      <Suspense fallback={<SummaryCardsSkeleton />}>
        <InteractiveWebVitalsChartSection summaryPromise={summaryPromise} seriesPromise={seriesPromise} />
      </Suspense>
      <Suspense>
        <WebVitalsTableSection
          perPagePromise={perPagePromise}
          perDevicePromise={perDevicePromise}
          perCountryPromise={perCountryPromise}
        />
      </Suspense>
    </div>
  );
}
