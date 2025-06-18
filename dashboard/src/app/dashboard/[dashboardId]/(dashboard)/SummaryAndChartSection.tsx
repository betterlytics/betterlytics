'use client';
import { useState, useCallback, use } from 'react';
import { formatDuration } from '@/utils/dateFormatters';
import {
  fetchSummaryStatsAction,
  fetchUniqueVisitorsAction,
  fetchTotalPageViewsAction,
  fetchSessionMetricsAction,
} from '@/app/actions';
import SummaryCardsSection, { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import OverviewChartSection from './OverviewChartSection';

type ActiveMetric = 'visitors' | 'pageviews' | 'bounceRate' | 'avgDuration';

type SummaryAndChartSectionProps = {
  data: Promise<
    [
      Awaited<ReturnType<typeof fetchSummaryStatsAction>>,
      visitorsData: Awaited<ReturnType<typeof fetchUniqueVisitorsAction>>,
      pageviewsData: Awaited<ReturnType<typeof fetchTotalPageViewsAction>>,
      sessionMetricsData: Awaited<ReturnType<typeof fetchSessionMetricsAction>>,
    ]
  >;
  comparisonData?: Promise<
    [
      comparisonVisitorsData: Awaited<ReturnType<typeof fetchUniqueVisitorsAction>>,
      comparisonPageviewsData: Awaited<ReturnType<typeof fetchTotalPageViewsAction>>,
      comparisonSessionMetricsData: Awaited<ReturnType<typeof fetchSessionMetricsAction>>,
    ]
  >;
};

export default function SummaryAndChartSection({ data, comparisonData }: SummaryAndChartSectionProps) {
  const [summary, visitorsData, pageviewsData, sessionMetricsData] = use(data);
  const comparisonResults = comparisonData ? use(comparisonData) : undefined;
  const [comparisonVisitorsData, comparisonPageviewsData, comparisonSessionMetricsData] = comparisonResults || [];
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>('visitors');

  const handleMetricChange = useCallback((metric: string) => {
    setActiveMetric(metric as ActiveMetric);
  }, []);

  const cards: SummaryCardData[] = [
    {
      title: 'Unique Visitors',
      value: summary.uniqueVisitors.toLocaleString(),
      rawChartData: summary.visitorsChartData,
      valueField: 'unique_visitors',
      chartColor: 'var(--chart-1)',
      isActive: activeMetric === 'visitors',
      onClick: () => handleMetricChange('visitors'),
    },
    {
      title: 'Total Pageviews',
      value: summary.pageviews.toLocaleString(),
      rawChartData: summary.pageviewsChartData,
      valueField: 'views',
      chartColor: 'var(--chart-2)',
      isActive: activeMetric === 'pageviews',
      onClick: () => handleMetricChange('pageviews'),
    },
    {
      title: 'Bounce Rate',
      value: summary.bounceRate !== undefined ? `${summary.bounceRate}%` : '0%',
      rawChartData: summary.bounceRateChartData,
      valueField: 'bounce_rate',
      chartColor: 'var(--chart-3)',
      isActive: activeMetric === 'bounceRate',
      onClick: () => handleMetricChange('bounceRate'),
    },
    {
      title: 'Avg. Visit Duration',
      value: formatDuration(summary.avgVisitDuration),
      rawChartData: summary.avgVisitDurationChartData,
      valueField: 'avg_visit_duration',
      chartColor: 'var(--chart-4)',
      isActive: activeMetric === 'avgDuration',
      onClick: () => handleMetricChange('avgDuration'),
    },
  ];

  return (
    <div className='space-y-6'>
      <SummaryCardsSection cards={cards} />

      <OverviewChartSection
        activeMetric={activeMetric}
        visitorsData={visitorsData}
        pageviewsData={pageviewsData}
        sessionMetricsData={sessionMetricsData}
        comparisonVisitorsData={comparisonVisitorsData}
        comparisonPageviewsData={comparisonPageviewsData}
        comparisonSessionMetricsData={comparisonSessionMetricsData}
        showComparison={!!comparisonResults}
      />
    </div>
  );
}
