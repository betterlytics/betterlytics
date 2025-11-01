import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import {
  fetchDeviceTypeBreakdownAction,
  fetchBrowserBreakdownAction,
  fetchOperatingSystemBreakdownAction,
  fetchDeviceUsageTrendAction,
} from '@/app/actions';
import { TableSkeleton, ChartSkeleton } from '@/components/skeleton';
import DevicesChartsSection from './DevicesChartsSection';
import DevicesTablesSection from './DevicesTablesSection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import type { FilterQuerySearchParams } from '@/entities/filterQueryParams';
import { getUserTimezone } from '@/lib/cookies';

type DevicesPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function DevicesPage({ params, searchParams }: DevicesPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate, granularity, queryFilters, compareStartDate, compareEndDate, interval } =
    BAFilterSearchParams.decode(await searchParams);
  const timezone = await getUserTimezone();

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
    interval,
    compareStartDate,
    compareEndDate,
  );

  const t = await getTranslations('dashboard.sidebar');

  return (
    <div className='container space-y-3 p-2 pt-4 sm:p-6'>
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
    </div>
  );
}
