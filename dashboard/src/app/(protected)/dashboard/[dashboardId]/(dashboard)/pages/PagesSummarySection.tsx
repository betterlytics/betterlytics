'use client';

import { fetchPagesSummaryWithChartsAction } from '@/app/actions/index.actions';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import { formatDuration } from '@/utils/dateFormatters';
import { useLocale, useTranslations } from 'next-intl';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { useBASuspenseQuery } from '@/hooks/useBASuspenseQuery';

export default function PagesSummarySection() {
  const { data: summaryWithCharts } = useBASuspenseQuery({
    queryKey: ['pages-summary-charts'],
    queryFn: (dashboardId, query) => fetchPagesSummaryWithChartsAction(dashboardId, query),
  });
  const locale = useLocale();
  const t = useTranslations('components.pages.summary');

  const cards: SummaryCardData[] = [
    {
      title: t('pagesPerSession'),
      value: formatNumber(summaryWithCharts.pagesPerSession, locale),
      rawChartData: summaryWithCharts.pagesPerSessionChartData,
      comparePercentage: summaryWithCharts.compareValues.pagesPerSession,
      valueField: 'value',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('totalPageviews'),
      value: formatNumber(summaryWithCharts.totalPageviews, locale),
      rawChartData: summaryWithCharts.pageviewsChartData,
      comparePercentage: summaryWithCharts.compareValues.totalPageviews,
      valueField: 'views',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('avgTimeOnPage'),
      value: formatDuration(summaryWithCharts.avgTimeOnPage, locale),
      rawChartData: summaryWithCharts.avgTimeChartData,
      comparePercentage: summaryWithCharts.compareValues.avgTimeOnPage,
      valueField: 'value',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('avgBounceRate'),
      value: formatPercentage(summaryWithCharts.avgBounceRate, locale),
      rawChartData: summaryWithCharts.bounceRateChartData,
      comparePercentage: summaryWithCharts.compareValues.avgBounceRate,
      valueField: 'value',
      chartColor: 'var(--chart-1)',
    },
  ];

  return <SummaryCardsSection cards={cards} />;
}
