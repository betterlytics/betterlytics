'use client';

import { use } from 'react';
import { fetchPagesSummaryWithChartsAction } from '@/app/actions';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import { formatDuration } from '@/utils/dateFormatters';
import { useTranslations } from 'next-intl';

type PagesSummarySectionProps = {
  pagesSummaryWithChartsPromise: ReturnType<typeof fetchPagesSummaryWithChartsAction>;
};

export default function PagesSummarySection({ pagesSummaryWithChartsPromise }: PagesSummarySectionProps) {
  const summaryWithCharts = use(pagesSummaryWithChartsPromise);
  const t = useTranslations('components.pages.summary');

  const cards: SummaryCardData[] = [
    {
      title: t('pagesPerSession'),
      value: summaryWithCharts.pagesPerSession.toLocaleString(),
      rawChartData: summaryWithCharts.pagesPerSessionChartData,
      valueField: 'value',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('totalPageviews'),
      value: summaryWithCharts.totalPageviews.toLocaleString(),
      rawChartData: summaryWithCharts.pageviewsChartData,
      valueField: 'views',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('avgTimeOnPage'),
      value: formatDuration(summaryWithCharts.avgTimeOnPage),
      rawChartData: summaryWithCharts.avgTimeChartData,
      valueField: 'value',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('avgBounceRate'),
      value: `${summaryWithCharts.avgBounceRate}%`,
      rawChartData: summaryWithCharts.bounceRateChartData,
      valueField: 'value',
      chartColor: 'var(--chart-1)',
    },
  ];

  return <SummaryCardsSection cards={cards} />;
}
