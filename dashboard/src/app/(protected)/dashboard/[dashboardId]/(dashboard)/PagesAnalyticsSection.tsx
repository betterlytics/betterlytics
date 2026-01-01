'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchPageAnalyticsCombinedAction } from '@/app/actions/index.actions';
import { use } from 'react';
import { useTranslations } from 'next-intl';
import { useFilterClick } from '@/hooks/use-filter-click';
import { TableGoToFooterLink } from './TableGoToFooterLink';

type PageAnalyticsSectionProps = {
  analyticsCombinedPromise: ReturnType<typeof fetchPageAnalyticsCombinedAction>;
};

export default function PagesAnalyticsSection({ analyticsCombinedPromise }: PageAnalyticsSectionProps) {
  const pageAnalyticsCombined = use(analyticsCombinedPromise);
  const t = useTranslations('dashboard');
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
      footer={<TableGoToFooterLink href='pages' label={t('goTo', { section: t('sidebar.pages') })} />}
    />
  );
}
