'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchPageAnalyticsCombinedAction } from '@/app/actions/index.actions';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useFilterClick } from '@/hooks/use-filter-click';
import { useBAQuery } from '@/hooks/useBAQuery';
import { QuerySection } from '@/components/QuerySection';
import { TableSkeleton } from '@/components/skeleton';

export default function PagesAnalyticsSection() {
  const query = useBAQuery({
    queryKey: ['pages-analytics'],
    queryFn: (dashboardId, q) => fetchPageAnalyticsCombinedAction(dashboardId, q, 10),
  });
  const t = useTranslations('dashboard');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  const onItemClick = (_tabKey: string, item: { label: string }) => {
    return makeFilterClick('url')(item.label);
  };

  return (
    <QuerySection query={query} fallback={<TableSkeleton />}>
      {(data) => (
        <MultiProgressTable
          title={t('sections.topPages')}
          defaultTab='pages'
          onItemClick={onItemClick}
          tabs={[
            {
              key: 'pages',
              label: t('tabs.pages'),
              data: data.topPages.map((page) => ({
                label: page.url,
                value: page.current.visitors,
                trendPercentage: page.change?.visitors,
                comparisonValue: page.compare?.visitors,
              })),
            },
            {
              key: 'entry',
              label: t('tabs.entryPages'),
              data: data.topEntryPages.map((page) => ({
                label: page.url,
                value: page.current.visitors,
                trendPercentage: page.change?.visitors,
                comparisonValue: page.compare?.visitors,
              })),
            },
            {
              key: 'exit',
              label: t('tabs.exitPages'),
              data: data.topExitPages.map((page) => ({
                label: page.url,
                value: page.current.visitors,
                trendPercentage: page.change?.visitors,
                comparisonValue: page.compare?.visitors,
              })),
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
      )}
    </QuerySection>
  );
}
