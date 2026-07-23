'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useFilterClick } from '@/hooks/use-filter-click';
import { useState } from 'react';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';

export default function PagesAnalyticsSection() {
  const [activeTab, setActiveTab] = useState('pages');
  const t = useTranslations('dashboard');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });
  const { input, options } = useBAQueryParams();

  const pagesQuery = trpc.overview.topPages.useQuery(input, { ...options, enabled: activeTab === 'pages' });
  const entryQuery = trpc.overview.topEntryPages.useQuery(input, { ...options, enabled: activeTab === 'entry' });
  const exitQuery = trpc.overview.topExitPages.useQuery(input, { ...options, enabled: activeTab === 'exit' });

  const pagesState = useQueryState(pagesQuery, activeTab === 'pages');
  const entryState = useQueryState(entryQuery, activeTab === 'entry');
  const exitState = useQueryState(exitQuery, activeTab === 'exit');
  const activeState = { pages: pagesState, entry: entryState, exit: exitState }[activeTab as 'pages' | 'entry' | 'exit'];

  const onItemClick = (_tabKey: string, item: { label: string }) => {
    return makeFilterClick('url')(item.label);
  };

  const mapPage = (page: {
    url: string;
    current: { visitors: number };
    change?: { visitors: number };
    compare?: { visitors: number };
  }) => ({
    label: page.url,
    value: page.current.visitors,
    trendPercentage: page.change?.visitors,
    comparisonValue: page.compare?.visitors,
  });

  return (
    <MultiProgressTable
      title={t('sections.topPages')}
      loading={activeState.refetching}
      defaultTab='pages'
      onTabChange={setActiveTab}
      onItemClick={onItemClick}
      tabs={[
        {
          key: 'pages',
          label: t('tabs.pages'),
          loading: pagesState.loading,
          data: (pagesQuery.data ?? []).map(mapPage),
        },
        {
          key: 'entry',
          label: t('tabs.entryPages'),
          loading: entryState.loading,
          data: (entryQuery.data ?? []).map(mapPage),
        },
        {
          key: 'exit',
          label: t('tabs.exitPages'),
          loading: exitState.loading,
          data: (exitQuery.data ?? []).map(mapPage),
        },
      ]}
      footer={
        <FilterPreservingLink
          href='pages'
          className='text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline'
        >
          <span>{t('goTo', { section: t('sidebar.pages') })}</span>
          <ArrowRight className='h-3.5 w-3.5' />
        </FilterPreservingLink>
      }
    />
  );
}
