import { Suspense } from 'react';
import { fetchCustomEventsOverviewAction } from '@/app/actions/analytics/events.actions';
import { TableSkeleton } from '@/components/skeleton';
import EventsTableSection from './EventsTableSection';
import { EventLog } from '@/app/(protected)/dashboard/[dashboardId]/(dashboard)/events/EventLog';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import type { FilterQuerySearchParams } from '@/entities/analytics/filterQueryParams.entities';
import { getUserTimezone } from '@/lib/cookies';

type EventsPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<FilterQuerySearchParams>;
};

export default async function EventsPage({ params, searchParams }: EventsPageParams) {
  const { dashboardId } = await params;
  const timezone = await getUserTimezone();
  const { startDate, endDate, queryFilters, compareStartDate, compareEndDate } = BAFilterSearchParams.decode(
    await searchParams,
    timezone,
  );
  const eventsPromise = fetchCustomEventsOverviewAction(
    dashboardId,
    startDate,
    endDate,
    queryFilters,
    compareStartDate,
    compareEndDate,
  );

  const t = await getTranslations('dashboard.sidebar');

  return (
    <div className='container space-y-3 p-2 pt-4 sm:p-6'>
      <DashboardHeader title={t('events')}>
        <DashboardFilters />
      </DashboardHeader>

      <Suspense fallback={<TableSkeleton />}>
        <EventsTableSection eventsPromise={eventsPromise} />
      </Suspense>

      <EventLog />
    </div>
  );
}
