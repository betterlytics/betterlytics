'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchPageAnalyticsCombinedAction } from '@/app/actions';
import { use } from 'react';
import { useTranslations } from 'next-intl';

type PageAnalyticsSectionProps = {
  analyticsCombinedPromise: ReturnType<typeof fetchPageAnalyticsCombinedAction>;
};

export default function PagesAnalyticsSection({ analyticsCombinedPromise }: PageAnalyticsSectionProps) {
  const pageAnalyticsCombined = use(analyticsCombinedPromise);
  const t = useTranslations('dashboard');

  return (
    <MultiProgressTable
      title={t('sections.topPages')}
      defaultTab='pages'
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
          emptyMessage: t('emptyStates.noPageData'),
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
          emptyMessage: t('emptyStates.noEntryPagesData'),
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
          emptyMessage: t('emptyStates.noExitPagesData'),
        },
      ]}
    />
  );
}
