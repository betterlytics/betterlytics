import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import { fetchCustomEventsOverviewAction } from '@/app/actions/events';
import { TableSkeleton } from '@/components/skeleton';
import EventsTableSection from './EventsTableSection';
import { EventLog } from '@/app/dashboard/[dashboardId]/events/EventLog';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { getTranslations } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';

type EventsPageParams = {
  params: Promise<{ dashboardId: string }>;
  searchParams: Promise<{ filters: string }>;
};

export default async function EventsPage({ params, searchParams }: EventsPageParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;
  const { startDate, endDate, queryFilters, compareStartDate, compareEndDate } = await BAFilterSearchParams.decode(
    await searchParams,
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
