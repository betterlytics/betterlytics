import { use } from 'react';
import { fetchReferrerSummaryWithChartsDataForSite } from '@/app/actions/index.action';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import { formatDuration } from '@/utils/dateFormatters';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { useTranslations } from 'next-intl';

type ReferrersSummarySectionProps = {
  referrerSummaryWithChartsPromise: ReturnType<typeof fetchReferrerSummaryWithChartsDataForSite>;
};

export default function ReferrersSummarySection({
  referrerSummaryWithChartsPromise,
}: ReferrersSummarySectionProps) {
  const summaryResult = use(referrerSummaryWithChartsPromise);
  const summaryData = summaryResult.data;
  const t = useTranslations('components.referrers.summary');

  const referralPercentage =
    summaryData.totalSessions > 0 ? (summaryData.referralSessions / summaryData.totalSessions) * 100 : 0;

  const cards: SummaryCardData[] = [
    {
      title: t('referralSessions'),
      value: formatNumber(summaryData.referralSessions),
      rawChartData: summaryData.referralSessionsChartData,
      valueField: 'referralSessions',
      chartColor: 'var(--chart-1)',
    },
    {
      title: t('referralTrafficPct'),
      value: formatPercentage(referralPercentage),
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
      value: formatDuration(summaryData.avgSessionDuration),
      rawChartData: summaryData.avgSessionDurationChartData,
      valueField: 'avgSessionDuration',
      chartColor: 'var(--chart-1)',
    },
  ];

  return <SummaryCardsSection cards={cards} />;
}
