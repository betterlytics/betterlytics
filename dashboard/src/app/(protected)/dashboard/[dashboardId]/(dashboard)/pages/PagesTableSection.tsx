'use client';

import { useState } from 'react';
import TabbedPagesTable from './TabbedPagesTable';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';

export default function PagesTableSection() {
  const [activeTab, setActiveTab] = useState('all');
  const { input, options } = useBAQueryParams();

  const pagesQuery = trpc.pages.pageAnalytics.useQuery(input, { ...options, enabled: activeTab === 'all' });
  const entryPagesQuery = trpc.pages.entryPageAnalytics.useQuery(input, {
    ...options,
    enabled: activeTab === 'entry',
  });
  const exitPagesQuery = trpc.pages.exitPageAnalytics.useQuery(input, {
    ...options,
    enabled: activeTab === 'exit',
  });

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
