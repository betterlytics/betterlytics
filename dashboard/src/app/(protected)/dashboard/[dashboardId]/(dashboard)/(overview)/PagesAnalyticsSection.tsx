'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useFilterClick } from '@/hooks/use-filter-click';
import { useState } from 'react';
import { useBAQuery } from '@/trpc/hooks';

export default function PagesAnalyticsSection() {
  const [activeTab, setActiveTab] = useState('pages');
  const t = useTranslations('dashboard');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  const pagesQuery = useBAQuery((t, input, opts) =>
    t.overview.topPages.useQuery(input, { ...opts, enabled: activeTab === 'pages' }),
  );
  const entryQuery = useBAQuery((t, input, opts) =>
    t.overview.topEntryPages.useQuery(input, { ...opts, enabled: activeTab === 'entry' }),
  );
  const exitQuery = useBAQuery((t, input, opts) =>
    t.overview.topExitPages.useQuery(input, { ...opts, enabled: activeTab === 'exit' }),
  );

  const onItemClick = (_tabKey: string, item: { label: string }) => {
    return makeFilterClick('url')(item.label);
  };

  const activeQuery = { pages: pagesQuery, entry: entryQuery, exit: exitQuery }[activeTab];

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
      loading={!!activeQuery?.isFetching && !!activeQuery?.data}
      defaultTab='pages'
      onTabChange={setActiveTab}
      onItemClick={onItemClick}
      tabs={[
        {
          key: 'pages',
          label: t('tabs.pages'),
          loading: pagesQuery.isFetching && !pagesQuery.data,
          data: (pagesQuery.data ?? []).map(mapPage),
        },
        {
          key: 'entry',
          label: t('tabs.entryPages'),
          loading: entryQuery.isFetching && !entryQuery.data,
          data: (entryQuery.data ?? []).map(mapPage),
        },
        {
          key: 'exit',
          label: t('tabs.exitPages'),
          loading: exitQuery.isFetching && !exitQuery.data,
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
