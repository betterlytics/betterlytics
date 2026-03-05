import { Suspense } from 'react';
import { fetchErrorGroupsInitialAction, fetchErrorVolumeAction } from '@/app/actions/analytics/errors.actions';
import { ChartSkeleton, TableSkeleton } from '@/components/skeleton';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { getUserTimezone } from '@/lib/cookies';
import { ErrorsOverviewChart } from './ErrorsOverviewChart';
import { ErrorGroupsSection } from './ErrorGroupsSection';
import type { FilterQuerySearchParams } from '@/entities/analytics/filterQueryParams.entities';

const PAGE_SIZE = 10;

type ErrorsPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function ErrorsPage({ params, searchParams }: ErrorsPageParams) {
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const query = BAFilterSearchParams.decode(await searchParams, timezone);

  const errorVolumePromise = fetchErrorVolumeAction(dashboardId, query);
  const initialPagePromise = fetchErrorGroupsInitialAction(dashboardId, query, PAGE_SIZE);

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title='Errors'>
        <DashboardFilters showComparison={false} />
      </DashboardHeader>

      <Suspense fallback={<ChartSkeleton />}>
        <ErrorsOverviewChart chartPromise={errorVolumePromise} />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <ErrorGroupsSection initialPagePromise={initialPagePromise} dashboardId={dashboardId} pageSize={PAGE_SIZE} />
      </Suspense>
    </div>
  );
}
