import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ChartSkeleton, TableSkeleton } from '@/components/skeleton';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import {
  fetchCoreWebVitalsSummaryAction,
  fetchCoreWebVitalChartDataAction,
  fetchCoreWebVitalsByDimensionAction,
} from '@/app/actions';
import InteractiveWebVitalsChartSection from './InteractiveWebVitalsChartSection';
import WebVitalsTableSection from './webVitalsTableSection';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import type { FilterQuerySearchParams } from '@/entities/filterQueryParams';

type PageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function WebVitalsPage({ params, searchParams }: PageParams) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate, queryFilters, granularity } = BAFilterSearchParams.decode(await searchParams);

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
  const perBrowserPromise = fetchCoreWebVitalsByDimensionAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    'browser',
  );
  const perOsPromise = fetchCoreWebVitalsByDimensionAction(dashboardId, startDate, endDate, queryFilters, 'os');
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('webVitals')}>
        <DashboardFilters />
      </DashboardHeader>

      <Suspense fallback={<ChartSkeleton />}>
        <InteractiveWebVitalsChartSection summaryPromise={summaryPromise} seriesPromise={seriesPromise} />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <WebVitalsTableSection
          perPagePromise={perPagePromise}
          perDevicePromise={perDevicePromise}
          perCountryPromise={perCountryPromise}
          perBrowserPromise={perBrowserPromise}
          perOsPromise={perOsPromise}
        />
      </Suspense>
    </div>
  );
}
