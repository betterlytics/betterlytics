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
import { useDictionary } from '@/contexts/DictionaryContextProvider';
import { betterlytics } from '@/lib/betterlytics';

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
};

export default function SummaryAndChartSection({ data }: SummaryAndChartSectionProps) {
  const [summary, visitorsData, pageviewsData, sessionMetricsData] = use(data);
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>('visitors');
  const { dictionary } = useDictionary();

  const handleMetricChange = useCallback((metric: string) => {
    betterlytics.event('dashboard-overview-metric-change', { metric });
    setActiveMetric(metric as ActiveMetric);
  }, []);

  const cards: SummaryCardData[] = [
    {
      title: dictionary.t('dashboard.metrics.uniqueVisitors'),
      value: summary.uniqueVisitors.toLocaleString(),
      rawChartData: summary.visitorsChartData,
      valueField: 'unique_visitors',
      chartColor: 'var(--chart-1)',
      isActive: activeMetric === 'visitors',
      onClick: () => handleMetricChange('visitors'),
    },
    {
      title: dictionary.t('dashboard.metrics.totalPageviews'),
      value: summary.pageviews.toLocaleString(),
      rawChartData: summary.pageviewsChartData,
      valueField: 'views',
      chartColor: 'var(--chart-2)',
      isActive: activeMetric === 'pageviews',
      onClick: () => handleMetricChange('pageviews'),
    },
    {
      title: dictionary.t('dashboard.metrics.bounceRate'),
      value: summary.bounceRate !== undefined ? `${summary.bounceRate}%` : '0%',
      rawChartData: summary.bounceRateChartData,
      valueField: 'bounce_rate',
      chartColor: 'var(--chart-3)',
      isActive: activeMetric === 'bounceRate',
      onClick: () => handleMetricChange('bounceRate'),
    },
    {
      title: dictionary.t('dashboard.metrics.avgVisitDuration'),
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
      />
    </div>
  );
}
