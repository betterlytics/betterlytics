'use client';
import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchPageAnalyticsCombinedAction } from '@/app/actions';
import { use } from 'react';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

type PageAnalyticsSectionProps = {
  analyticsCombinedPromise: ReturnType<typeof fetchPageAnalyticsCombinedAction>;
};

export default function PagesAnalyticsSection({ analyticsCombinedPromise }: PageAnalyticsSectionProps) {
  const pageAnalyticsCombined = use(analyticsCombinedPromise);
  const { dictionary } = useDictionary();

  return (
    <MultiProgressTable
      title={dictionary.t('dashboard.sections.topPages')}
      defaultTab='pages'
      tabs={[
        {
          key: 'pages',
          label: dictionary.t('dashboard.tabs.pages'),
          data: pageAnalyticsCombined.topPages.map((page) => ({ label: page.url, value: page.visitors })),
          emptyMessage: dictionary.t('dashboard.emptyStates.noPageData'),
        },
        {
          key: 'entry',
          label: dictionary.t('dashboard.tabs.entryPages'),
          data: pageAnalyticsCombined.topEntryPages.map((page) => ({ label: page.url, value: page.visitors })),
          emptyMessage: dictionary.t('dashboard.emptyStates.noEntryPagesData'),
        },
        {
          key: 'exit',
          label: dictionary.t('dashboard.tabs.exitPages'),
          data: pageAnalyticsCombined.topExitPages.map((page) => ({ label: page.url, value: page.visitors })),
          emptyMessage: dictionary.t('dashboard.emptyStates.noExitPagesData'),
        },
      ]}
    />
  );
}
