'use client';

import { useState } from 'react';
import TabbedPagesTable from './TabbedPagesTable';
import { useBAQuery } from '@/trpc/hooks';

export default function PagesTableSection() {
  const [activeTab, setActiveTab] = useState('all');

  const pagesQuery = useBAQuery((t, input, opts) =>
    t.pages.pageAnalytics.useQuery(input, { ...opts, enabled: activeTab === 'all' }),
  );
  const entryPagesQuery = useBAQuery((t, input, opts) =>
    t.pages.entryPageAnalytics.useQuery(input, { ...opts, enabled: activeTab === 'entry' }),
  );
  const exitPagesQuery = useBAQuery((t, input, opts) =>
    t.pages.exitPageAnalytics.useQuery(input, { ...opts, enabled: activeTab === 'exit' }),
  );

  return (
    <TabbedPagesTable
      allPagesData={pagesQuery.data ?? []}
      entryPagesData={entryPagesQuery.data ?? []}
      exitPagesData={exitPagesQuery.data ?? []}
      allPagesLoading={pagesQuery.isLoading}
      entryPagesLoading={entryPagesQuery.isLoading}
      exitPagesLoading={exitPagesQuery.isLoading}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}
