'use client';

import { fetchReferrerSummaryWithChartsDataForSite } from '@/app/actions/index.actions';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import { formatDuration } from '@/utils/dateFormatters';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { useLocale, useTranslations } from 'next-intl';
import { useBAQuery } from '@/hooks/useBAQuery';
import { QuerySection } from '@/components/QuerySection';
import { SummaryCardsSkeleton } from '@/components/skeleton';

export default function ReferrersSummarySection() {
  const query = useBAQuery({
    queryKey: ['referrer-summary-charts'],
    queryFn: (dashboardId, query) => fetchReferrerSummaryWithChartsDataForSite(dashboardId, query),
  });
  const locale = useLocale();
  const t = useTranslations('components.referrers.summary');

  return (
    <QuerySection query={query} fallback={<SummaryCardsSkeleton count={4} />}>
      {(summaryResult) => {
        const summaryData = summaryResult.data;

        const referralPercentage =
          summaryData.totalSessions > 0 ? (summaryData.referralSessions / summaryData.totalSessions) * 100 : 0;

        const cards: SummaryCardData[] = [
          {
            title: t('referralSessions'),
            value: formatNumber(summaryData.referralSessions, locale),
            rawChartData: summaryData.referralSessionsChartData,
            valueField: 'referralSessions',
            chartColor: 'var(--chart-1)',
          },
          {
            title: t('referralTrafficPct'),
            value: formatPercentage(referralPercentage, locale),
            rawChartData: summaryData.referralPercentageChartData,
            valueField: 'referralPercentage',
            chartColor: 'var(--chart-1)',
          },
          {
            title: t('topReferrerSource'),
            value: summaryData.topReferrerSource ?? t('none'),
          },
          {
            title: t('avgSessionDuration'),
            value: formatDuration(summaryData.avgSessionDuration, locale),
            rawChartData: summaryData.avgSessionDurationChartData,
            valueField: 'avgSessionDuration',
            chartColor: 'var(--chart-1)',
          },
        ];

        return <SummaryCardsSection cards={cards} />;
      }}
    </QuerySection>
  );
}
