'use client';

import { useState } from 'react';
import TabbedPagesTable from './TabbedPagesTable';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';

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

  const pagesState = useQueryState(pagesQuery, activeTab === 'all');
  const entryPagesState = useQueryState(entryPagesQuery, activeTab === 'entry');
  const exitPagesState = useQueryState(exitPagesQuery, activeTab === 'exit');
  const activeState = { all: pagesState, entry: entryPagesState, exit: exitPagesState }[activeTab as 'all' | 'entry' | 'exit'];

  return (
    <TabbedPagesTable
      allPagesData={pagesQuery.data ?? []}
      entryPagesData={entryPagesQuery.data ?? []}
      exitPagesData={exitPagesQuery.data ?? []}
      allPagesLoading={pagesState.loading}
      entryPagesLoading={entryPagesState.loading}
      exitPagesLoading={exitPagesState.loading}
      loading={activeState.refetching}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}
