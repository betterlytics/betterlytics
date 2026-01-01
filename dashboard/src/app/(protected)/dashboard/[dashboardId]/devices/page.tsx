import { Suspense } from 'react';
import {
  fetchDeviceTypeBreakdownAction,
  fetchBrowserBreakdownAction,
  fetchOperatingSystemBreakdownAction,
  fetchDeviceUsageTrendAction,
} from '@/app/actions/index.actions';
import { TableSkeleton, ChartSkeleton } from '@/components/skeleton';
import DevicesChartsSection from './DevicesChartsSection';
import DevicesTablesSection from './DevicesTablesSection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import type { FilterQuerySearchParams } from '@/entities/analytics/filterQueryParams.entities';
import { getUserTimezone } from '@/lib/cookies';
import { PageContainer } from '@/components/layout';

type DevicesPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function DevicesPage({ params, searchParams }: DevicesPageParams) {
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const { startDate, endDate, granularity, queryFilters, compareStartDate, compareEndDate } =
    BAFilterSearchParams.decode(await searchParams, timezone);

  const deviceBreakdownPromise = fetchDeviceTypeBreakdownAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );
  const browserStatsPromise = fetchBrowserBreakdownAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );
  const osStatsPromise = fetchOperatingSystemBreakdownAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );
  const deviceUsageTrendPromise = fetchDeviceUsageTrendAction(
    dashboardId,
    startDate,
    endDate,
    granularity,
    queryFilters,
    timezone,
    compareStartDate,
    compareEndDate,
  );

  const t = await getTranslations('dashboard.sidebar');

  return (
    <PageContainer>
      <DashboardHeader title={t('devices')}>
        <DashboardFilters />
      </DashboardHeader>

      <Suspense
        fallback={
          <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
            <div className='md:col-span-2'>
              <ChartSkeleton />
            </div>

            <div className='md:col-span-1'>
              <ChartSkeleton />
            </div>
          </div>
        }
      >
        <DevicesChartsSection
          deviceBreakdownPromise={deviceBreakdownPromise}
          deviceUsageTrendPromise={deviceUsageTrendPromise}
        />
      </Suspense>

      <Suspense
        fallback={
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
            <TableSkeleton />
            <TableSkeleton />
          </div>
        }
      >
        <DevicesTablesSection browserStatsPromise={browserStatsPromise} osStatsPromise={osStatsPromise} />
      </Suspense>
    </PageContainer>
  );
}
