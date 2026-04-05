'use client';

import { EventsTable } from './EventsTable';
import { fetchCustomEventsOverviewAction } from '@/app/actions/analytics/events.actions';
import { useBASuspenseQuery } from '@/hooks/useBASuspenseQuery';

export default function EventsTableSection() {
  const { data: events } = useBASuspenseQuery({
    queryKey: ['events-overview'],
    queryFn: (dashboardId, query) => fetchCustomEventsOverviewAction(dashboardId, query),
  });
  return <EventsTable data={events} />;
}
