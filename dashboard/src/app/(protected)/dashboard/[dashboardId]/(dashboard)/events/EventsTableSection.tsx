'use client';

import { EventsTable } from './EventsTable';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { QuerySection } from '@/components/QuerySection';
import { TableSkeleton } from '@/components/skeleton';

export default function EventsTableSection() {
  const { input, options } = useBAQueryParams();
  const query = trpc.events.customEventsOverview.useQuery(input, options);
  return (
    <QuerySection query={query} fallback={<TableSkeleton />} className='overflow-x-auto'>
      {(events) => <EventsTable data={events} />}
    </QuerySection>
  );
}
