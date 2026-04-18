'use client';

import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import { formatDuration } from '@/utils/dateFormatters';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { useLocale, useTranslations } from 'next-intl';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';

export default function ReferrersSummarySection() {
  const { input, options } = useBAQueryParams();
  const query = trpc.referrers.summary.useQuery(input, options);
  const locale = useLocale();
  const t = useTranslations('components.referrers.summary');
  const { data, loading } = useQueryState(query);

  const referralPercentage =
    data && data.totalSessions > 0 ? (data.referralSessions / data.totalSessions) * 100 : 0;

  const cards: SummaryCardData[] = [
    {
      title: t('referralSessions'),
      loading,
      value: data ? formatNumber(data.referralSessions, locale) : undefined,
      rawChartData: data?.referralSessionsChartData,
      valueField: 'referralSessions',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('referralTrafficPct'),
      loading,
      value: data ? formatPercentage(referralPercentage, locale) : undefined,
      rawChartData: data?.referralPercentageChartData,
      valueField: 'referralPercentage',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('topReferrerSource'),
      loading,
      value: data ? (data.topReferrerSource ?? t('none')) : undefined,
    },
    {
      title: t('avgSessionDuration'),
      loading,
      value: data ? formatDuration(data.avgSessionDuration, locale) : undefined,
      rawChartData: data?.avgSessionDurationChartData,
      valueField: 'avgSessionDuration',
      chartColor: 'var(--chart-1)',
    },
  ];

  return <SummaryCardsSection cards={cards} />;
}
