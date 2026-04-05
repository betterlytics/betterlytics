'use client';

import TabbedPagesTable from './TabbedPagesTable';
import {
  fetchPageAnalyticsAction,
  fetchEntryPageAnalyticsAction,
  fetchExitPageAnalyticsAction,
} from '@/app/actions/index.actions';
import { useBAQuery } from '@/hooks/useBAQuery';
import { QuerySection } from '@/components/QuerySection';
import { TableSkeleton } from '@/components/skeleton';

export default function PagesTableSection() {
  const pagesQuery = useBAQuery({
    queryKey: ['page-analytics'],
    queryFn: (dashboardId, query) => fetchPageAnalyticsAction(dashboardId, query),
  });
  const entryPagesQuery = useBAQuery({
    queryKey: ['entry-page-analytics'],
    queryFn: (dashboardId, query) => fetchEntryPageAnalyticsAction(dashboardId, query),
  });
  const exitPagesQuery = useBAQuery({
    queryKey: ['exit-page-analytics'],
    queryFn: (dashboardId, query) => fetchExitPageAnalyticsAction(dashboardId, query),
  });

  if (pagesQuery.isPending || entryPagesQuery.isPending || exitPagesQuery.isPending) return <TableSkeleton />;

  return (
    <QuerySection loading={pagesQuery.isFetching || entryPagesQuery.isFetching || exitPagesQuery.isFetching}>
      <TabbedPagesTable allPagesData={pagesQuery.data!} entryPagesData={entryPagesQuery.data!} exitPagesData={exitPagesQuery.data!} />
    </QuerySection>
  );
}
