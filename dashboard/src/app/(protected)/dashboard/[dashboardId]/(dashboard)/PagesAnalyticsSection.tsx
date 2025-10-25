'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchPageAnalyticsCombinedAction } from '@/app/actions';
import { use } from 'react';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { ArrowRight } from 'lucide-react';
import { useFilterClick } from '@/hooks/use-filter-click';

type PageAnalyticsSectionProps = {
  analyticsCombinedPromise: ReturnType<typeof fetchPageAnalyticsCombinedAction>;
};

export default function PagesAnalyticsSection({ analyticsCombinedPromise }: PageAnalyticsSectionProps) {
  const pageAnalyticsCombined = use(analyticsCombinedPromise);
  const t = useTranslations('dashboard');
  const dashboardId = useDashboardId();
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  const onItemClick = (_tabKey: string, item: { label: string }) => {
    return makeFilterClick('url')(item.label);
  };

  return (
    <MultiProgressTable
      title={t('sections.topPages')}
      defaultTab='pages'
      onItemClick={onItemClick}
      tabs={[
        {
          key: 'pages',
          label: t('tabs.pages'),
          data: pageAnalyticsCombined.topPages.map((page) => ({
            label: page.url,
            value: page.current.visitors,
            trendPercentage: page.change?.visitors,
            comparisonValue: page.compare?.visitors,
          })),
        },
        {
          key: 'entry',
          label: t('tabs.entryPages'),
          data: pageAnalyticsCombined.topEntryPages.map((page) => ({
            label: page.url,
            value: page.current.visitors,
            trendPercentage: page.change?.visitors,
            comparisonValue: page.compare?.visitors,
          })),
        },
        {
          key: 'exit',
          label: t('tabs.exitPages'),
          data: pageAnalyticsCombined.topExitPages.map((page) => ({
            label: page.url,
            value: page.current.visitors,
            trendPercentage: page.change?.visitors,
            comparisonValue: page.compare?.visitors,
          })),
        },
      ]}
      footer={
        <FilterPreservingLink
          href={`/dashboard/${dashboardId}/pages`}
          className='text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline'
        >
          <span>{t('goTo', { section: t('sidebar.pages') })}</span>
          <ArrowRight className='h-3.5 w-3.5' />
        </FilterPreservingLink>
      }
    />
  );
}
