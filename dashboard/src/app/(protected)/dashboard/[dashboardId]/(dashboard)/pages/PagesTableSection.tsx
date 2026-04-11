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

  const queries = { all: pagesQuery, entry: entryPagesQuery, exit: exitPagesQuery };
  const activeQuery = queries[activeTab as keyof typeof queries];

  return (
    <TabbedPagesTable
      allPagesData={pagesQuery.data ?? []}
      entryPagesData={entryPagesQuery.data ?? []}
      exitPagesData={exitPagesQuery.data ?? []}
      allPagesLoading={pagesQuery.isFetching && !pagesQuery.data}
      entryPagesLoading={entryPagesQuery.isFetching && !entryPagesQuery.data}
      exitPagesLoading={exitPagesQuery.isFetching && !exitPagesQuery.data}
      loading={!!activeQuery?.isFetching && !!activeQuery?.data}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}
