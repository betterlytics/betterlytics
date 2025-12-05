import { use } from 'react';
import { EventsTable } from '@/app/(protected)/dashboard/[dashboardId]/events/EventsTable';
import { fetchCustomEventsOverviewAction } from '@/app/actions/analytics/events';

type EventsTableSectionProps = {
  eventsPromise: ReturnType<typeof fetchCustomEventsOverviewAction>;
};

export default function EventsTableSection({ eventsPromise }: EventsTableSectionProps) {
  const events = use(eventsPromise);

  return <EventsTable data={events} />;
}
