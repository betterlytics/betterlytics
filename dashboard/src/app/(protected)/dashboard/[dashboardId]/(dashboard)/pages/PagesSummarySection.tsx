'use client';

import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import { formatDuration } from '@/utils/dateFormatters';
import { useLocale, useTranslations } from 'next-intl';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';

export default function PagesSummarySection() {
  const { input, options } = useBAQueryParams();
  const query = trpc.pages.summaryWithCharts.useQuery(input, options);
  const locale = useLocale();
  const t = useTranslations('components.pages.summary');
  const { data, loading } = useQueryState(query);

  const cards: SummaryCardData[] = [
    {
      title: t('pagesPerSession'),
      loading,
      value: data ? formatNumber(data.pagesPerSession, locale) : undefined,
      rawChartData: data?.pagesPerSessionChartData,
      comparePercentage: data?.compareValues.pagesPerSession,
      valueField: 'value',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('totalPageviews'),
      loading,
      value: data ? formatNumber(data.totalPageviews, locale) : undefined,
      rawChartData: data?.pageviewsChartData,
      comparePercentage: data?.compareValues.totalPageviews,
      valueField: 'views',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('avgTimeOnPage'),
      loading,
      value: data ? formatDuration(data.avgTimeOnPage, locale) : undefined,
      rawChartData: data?.avgTimeChartData,
      comparePercentage: data?.compareValues.avgTimeOnPage,
      valueField: 'value',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('avgBounceRate'),
      loading,
      value: data ? formatPercentage(data.avgBounceRate, locale) : undefined,
      rawChartData: data?.bounceRateChartData,
      comparePercentage: data?.compareValues.avgBounceRate,
      valueField: 'value',
      chartColor: 'var(--chart-1)',
    },
  ];

  return <SummaryCardsSection cards={cards} />;
}
