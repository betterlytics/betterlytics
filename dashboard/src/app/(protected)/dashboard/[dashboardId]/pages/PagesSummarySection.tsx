'use client';

import { use } from 'react';
import { fetchPagesSummaryWithChartsAction } from '@/app/actions/index.action';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import { formatDuration } from '@/utils/dateFormatters';
import { useTranslations } from 'next-intl';
import { formatNumber, formatPercentage } from '@/utils/formatters';

type PagesSummarySectionProps = {
  pagesSummaryWithChartsPromise: ReturnType<typeof fetchPagesSummaryWithChartsAction>;
};

export default function PagesSummarySection({ pagesSummaryWithChartsPromise }: PagesSummarySectionProps) {
  const summaryWithCharts = use(pagesSummaryWithChartsPromise);
  const t = useTranslations('components.pages.summary');

  const cards: SummaryCardData[] = [
    {
      title: t('pagesPerSession'),
      value: formatNumber(summaryWithCharts.pagesPerSession),
      rawChartData: summaryWithCharts.pagesPerSessionChartData,
      comparePercentage: summaryWithCharts.compareValues.pagesPerSession,
      valueField: 'value',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('totalPageviews'),
      value: formatNumber(summaryWithCharts.totalPageviews),
      rawChartData: summaryWithCharts.pageviewsChartData,
      comparePercentage: summaryWithCharts.compareValues.totalPageviews,
      valueField: 'views',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('avgTimeOnPage'),
      value: formatDuration(summaryWithCharts.avgTimeOnPage),
      rawChartData: summaryWithCharts.avgTimeChartData,
      comparePercentage: summaryWithCharts.compareValues.avgTimeOnPage,
      valueField: 'value',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('avgBounceRate'),
      value: formatPercentage(summaryWithCharts.avgBounceRate),
      rawChartData: summaryWithCharts.bounceRateChartData,
      comparePercentage: summaryWithCharts.compareValues.avgBounceRate,
      valueField: 'value',
      chartColor: 'var(--chart-1)',
    },
  ];

  return <SummaryCardsSection cards={cards} />;
}
