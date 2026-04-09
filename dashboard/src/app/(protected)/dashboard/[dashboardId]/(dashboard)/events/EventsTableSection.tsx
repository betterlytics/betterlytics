'use client';

import { EventsTable } from './EventsTable';
import { useBAQuery } from '@/trpc/hooks';
import { QuerySection } from '@/components/QuerySection';
import { TableSkeleton } from '@/components/skeleton';

export default function EventsTableSection() {
  const query = useBAQuery((t, input, opts) => t.events.customEventsOverview.useQuery(input, opts));
  return (
    <QuerySection query={query} fallback={<TableSkeleton />}>
      {(events) => <EventsTable data={events} />}
    </QuerySection>
  );
}
