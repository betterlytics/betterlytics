'use client';

import { use } from 'react';
import TabbedPagesTable from '@/app/(protected)/dashboard/[dashboardId]/pages/TabbedPagesTable';
import {
  fetchPageAnalyticsAction,
  fetchEntryPageAnalyticsAction,
  fetchExitPageAnalyticsAction,
} from '@/app/actions/index.action';

type PagesTableSectionProps = {
  pageAnalyticsPromise: ReturnType<typeof fetchPageAnalyticsAction>;
  entryPageAnalyticsPromise: ReturnType<typeof fetchEntryPageAnalyticsAction>;
  exitPageAnalyticsPromise: ReturnType<typeof fetchExitPageAnalyticsAction>;
};

export default function PagesTableSection({
  pageAnalyticsPromise,
  entryPageAnalyticsPromise,
  exitPageAnalyticsPromise,
}: PagesTableSectionProps) {
  const pages = use(pageAnalyticsPromise);
  const entryPages = use(entryPageAnalyticsPromise);
  const exitPages = use(exitPageAnalyticsPromise);

  return <TabbedPagesTable allPagesData={pages} entryPagesData={entryPages} exitPagesData={exitPages} />;
}
