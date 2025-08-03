'use client';

import { use } from 'react';
import { fetchPagesSummaryWithChartsAction } from '@/app/actions';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import { formatDuration } from '@/utils/dateFormatters';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

type PagesSummarySectionProps = {
  pagesSummaryWithChartsPromise: ReturnType<typeof fetchPagesSummaryWithChartsAction>;
};

export default function PagesSummarySection({ pagesSummaryWithChartsPromise }: PagesSummarySectionProps) {
  const summaryWithCharts = use(pagesSummaryWithChartsPromise);
  const { dictionary } = useDictionary();

  const cards: SummaryCardData[] = [
    {
      title: dictionary.t('components.pages.summary.pagesPerSession'),
      value: summaryWithCharts.pagesPerSession.toLocaleString(),
      rawChartData: summaryWithCharts.pagesPerSessionChartData,
      valueField: 'value',
      chartColor: 'var(--chart-1)',
    },
    {
      title: dictionary.t('components.pages.summary.totalPageviews'),
      value: summaryWithCharts.totalPageviews.toLocaleString(),
      rawChartData: summaryWithCharts.pageviewsChartData,
      valueField: 'views',
      chartColor: 'var(--chart-2)',
    },
    {
      title: dictionary.t('components.pages.summary.avgTimeOnPage'),
      value: formatDuration(summaryWithCharts.avgTimeOnPage),
      rawChartData: summaryWithCharts.avgTimeChartData,
      valueField: 'value',
      chartColor: 'var(--chart-3)',
    },
    {
      title: dictionary.t('components.pages.summary.avgBounceRate'),
      value: `${summaryWithCharts.avgBounceRate}%`,
      rawChartData: summaryWithCharts.bounceRateChartData,
      valueField: 'value',
      chartColor: 'var(--chart-4)',
    },
  ];

  return <SummaryCardsSection cards={cards} />;
}
