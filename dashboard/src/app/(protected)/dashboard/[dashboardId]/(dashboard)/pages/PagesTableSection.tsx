'use client';

import TabbedPagesTable from './TabbedPagesTable';
import {
  fetchPageAnalyticsAction,
  fetchEntryPageAnalyticsAction,
  fetchExitPageAnalyticsAction,
} from '@/app/actions/index.actions';
import { useBASuspenseQuery } from '@/hooks/useBASuspenseQuery';

export default function PagesTableSection() {
  const { data: pages } = useBASuspenseQuery({
    queryKey: ['page-analytics'],
    queryFn: (dashboardId, query) => fetchPageAnalyticsAction(dashboardId, query),
  });
  const { data: entryPages } = useBASuspenseQuery({
    queryKey: ['entry-page-analytics'],
    queryFn: (dashboardId, query) => fetchEntryPageAnalyticsAction(dashboardId, query),
  });
  const { data: exitPages } = useBASuspenseQuery({
    queryKey: ['exit-page-analytics'],
    queryFn: (dashboardId, query) => fetchExitPageAnalyticsAction(dashboardId, query),
  });

  return <TabbedPagesTable allPagesData={pages} entryPagesData={entryPages} exitPagesData={exitPages} />;
}
