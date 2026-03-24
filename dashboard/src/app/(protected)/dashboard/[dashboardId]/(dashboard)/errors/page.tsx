import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchErrorGroupsAction } from '@/app/actions/analytics/errors.actions';
import { TableSkeleton } from '@/components/skeleton';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { getUserTimezone } from '@/lib/cookies';
import { ErrorGroupsSection } from './ErrorGroupsSection';
import type { FilterQuerySearchParams } from '@/entities/analytics/filterQueryParams.entities';
import { isFeatureEnabled } from '@/lib/feature-flags';

type ErrorsPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function ErrorsPage({ params, searchParams }: ErrorsPageParams) {
  if (!isFeatureEnabled('enableErrorTracking')) {
    notFound();
  }
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const query = BAFilterSearchParams.decode(await searchParams, timezone);

  const groupsPromise = fetchErrorGroupsAction(dashboardId, query);

  return (
    <div className='container space-y-4 p-2 pt-4 sm:p-6'>
      <DashboardHeader title='Errors'>
        <DashboardFilters showComparison={false} />
      </DashboardHeader>

      <Suspense fallback={<TableSkeleton />}>
        <ErrorGroupsSection groupsPromise={groupsPromise} dashboardId={dashboardId} />
      </Suspense>
    </div>
  );
}
