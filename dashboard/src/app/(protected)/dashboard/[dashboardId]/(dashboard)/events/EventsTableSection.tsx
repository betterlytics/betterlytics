'use client';

import { EventsTable } from './EventsTable';
import { fetchCustomEventsOverviewAction } from '@/app/actions/analytics/events.actions';
import { useBAQuery } from '@/hooks/useBAQuery';
import { QuerySection } from '@/components/QuerySection';
import { TableSkeleton } from '@/components/skeleton';

export default function EventsTableSection() {
  const query = useBAQuery({
    queryKey: ['events-overview'],
    queryFn: (dashboardId, q) => fetchCustomEventsOverviewAction(dashboardId, q),
  });
  return (
    <QuerySection query={query} fallback={<TableSkeleton />}>
      {(events) => <EventsTable data={events} />}
    </QuerySection>
  );
}
