import { Suspense } from 'react';
import { ChartSkeleton, TableSkeleton } from '@/components/skeleton';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import {
  fetchCoreWebVitalsSummaryAction,
  fetchCoreWebVitalChartDataAction,
  fetchCoreWebVitalsByDimensionAction,
  fetchHasCoreWebVitalsData,
} from '@/app/actions/index.actions';
import InteractiveWebVitalsChartSection from './InteractiveWebVitalsChartSection';
import WebVitalsTableSection from './webVitalsTableSection';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import type { FilterQuerySearchParams } from '@/entities/analytics/filterQueryParams.entities';
import { WebVitalsBanner } from './WebVitalsBanner';
import { getUserTimezone } from '@/lib/cookies';

type PageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function WebVitalsPage({ params, searchParams }: PageParams) {
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const query = BAFilterSearchParams.decode(await searchParams, timezone);

  const summaryPromise = fetchCoreWebVitalsSummaryAction(dashboardId, query);
  const seriesPromise = fetchCoreWebVitalChartDataAction(dashboardId, query);
  const perPagePromise = fetchCoreWebVitalsByDimensionAction(dashboardId, query, 'url');
  const perDevicePromise = fetchCoreWebVitalsByDimensionAction(dashboardId, query, 'device_type');
  const perCountryPromise = fetchCoreWebVitalsByDimensionAction(dashboardId, query, 'country_code');
  const perBrowserPromise = fetchCoreWebVitalsByDimensionAction(dashboardId, query, 'browser');
  const perOsPromise = fetchCoreWebVitalsByDimensionAction(dashboardId, query, 'os');
  const hasDataPromise = fetchHasCoreWebVitalsData(dashboardId);
  const t = await getTranslations('dashboard.sidebar');
  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('webVitals')}>
        <DashboardFilters showComparison={false} />
      </DashboardHeader>
      <WebVitalsBanner hasDataPromise={hasDataPromise} />
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
