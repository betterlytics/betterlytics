import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import {
  fetchDeviceSummaryAction,
  fetchDeviceTypeBreakdownAction,
  fetchBrowserBreakdownAction,
  fetchOperatingSystemBreakdownAction,
  fetchDeviceUsageTrendAction,
} from '@/app/actions';
import { SummaryCardsSkeleton, TableSkeleton, ChartSkeleton } from '@/components/skeleton';
import DevicesSummarySection from './DevicesSummarySection';
import DevicesChartsSection from './DevicesChartsSection';
import DevicesTablesSection from './DevicesTablesSection';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';

type DevicesPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<{ filters: string }>;
};

export default async function DevicesPage({ params, searchParams }: DevicesPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate, granularity, queryFilters, compareStartDate, compareEndDate } =
    await BAFilterSearchParams.decodeFromParams(searchParams);

  const deviceSummaryPromise = fetchDeviceSummaryAction(dashboardId, startDate, endDate, queryFilters);
  const deviceBreakdownPromise = fetchDeviceTypeBreakdownAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );
  const browserStatsPromise = fetchBrowserBreakdownAction(dashboardId, startDate, endDate, queryFilters);
  const osStatsPromise = fetchOperatingSystemBreakdownAction(dashboardId, startDate, endDate, queryFilters);
  const deviceUsageTrendPromise = fetchDeviceUsageTrendAction(
    dashboardId,
    startDate,
    endDate,
    granularity,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );

  return (
    <div className='container space-y-6 p-6'>
      <div className='flex flex-col justify-between gap-y-4 lg:flex-row lg:items-center'>
        <div>
          <h1 className='text-foreground mb-1 text-2xl font-bold'>Devices</h1>
          <p className='text-muted-foreground text-sm'>Visitor device breakdown and usage analytics</p>
        </div>
        <DashboardFilters />
      </div>

      <Suspense fallback={<SummaryCardsSkeleton count={4} />}>
        <DevicesSummarySection deviceSummaryPromise={deviceSummaryPromise} />
      </Suspense>

      <Suspense
        fallback={
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <ChartSkeleton />
            <ChartSkeleton />
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
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
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
