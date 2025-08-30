import { use } from 'react';
import { fetchReferrerSummaryWithChartsDataForSite } from '@/app/actions';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import { formatDuration } from '@/utils/dateFormatters';
import { formatPercentage } from '@/utils/formatters';

type ReferrersSummarySectionProps = {
  referrerSummaryWithChartsPromise: ReturnType<typeof fetchReferrerSummaryWithChartsDataForSite>;
};

export default function ReferrersSummarySection({
  referrerSummaryWithChartsPromise,
}: ReferrersSummarySectionProps) {
  const summaryResult = use(referrerSummaryWithChartsPromise);
  const summaryData = summaryResult.data;

  const referralPercentage =
    summaryData.totalSessions > 0 ? (summaryData.referralSessions / summaryData.totalSessions) * 100 : 0;

  const cards: SummaryCardData[] = [
    {
      title: 'Referral Sessions',
      value: summaryData.referralSessions.toLocaleString(),
      rawChartData: summaryData.referralSessionsChartData,
      valueField: 'referralSessions',
      chartColor: 'var(--chart-1)',
    },
    {
      title: 'Referral Traffic %',
      value: formatPercentage(referralPercentage),
      rawChartData: summaryData.referralPercentageChartData,
      valueField: 'referralPercentage',
      chartColor: 'var(--chart-1)',
    },
    {
      title: 'Top Referrer Source',
      value: summaryData.topReferrerSource ?? 'None',
    },
    {
      title: 'Avg. Session Duration',
      value: formatDuration(summaryData.avgSessionDuration),
      rawChartData: summaryData.avgSessionDurationChartData,
      valueField: 'avgSessionDuration',
      chartColor: 'var(--chart-1)',
    },
  ];

  return <SummaryCardsSection cards={cards} />;
}
