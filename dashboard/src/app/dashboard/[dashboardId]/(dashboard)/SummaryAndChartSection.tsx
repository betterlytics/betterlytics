'use client';
import { useState, useCallback, use } from 'react';
import { formatDuration } from '@/utils/dateFormatters';
import {
  fetchSummaryStatsAction,
  fetchUniqueVisitorsAction,
  fetchTotalPageViewsAction,
  fetchSessionMetricsAction,
} from '@/app/actions';
import { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import OverviewChartSection from './OverviewChartSection';
import { useTranslations } from 'next-intl';

type ActiveMetric = 'visitors' | 'sessions' | 'pageviews' | 'bounceRate' | 'avgDuration' | 'pagesPerSession';

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
  const t = useTranslations('dashboard.metrics');

  const handleMetricChange = useCallback((metric: string) => {
    setActiveMetric(metric as ActiveMetric);
  }, []);

  const cards: SummaryCardData[] = [
    {
      title: t('uniqueVisitors'),
      value: summary.uniqueVisitors.toLocaleString(),
      rawChartData: summary.visitorsChartData,
      valueField: 'unique_visitors',
      chartColor: 'var(--chart-1)',
      isActive: activeMetric === 'visitors',
      onClick: () => handleMetricChange('visitors'),
    },
    {
      title: t('totalPageviews'),
      value: summary.pageviews.toLocaleString(),
      rawChartData: summary.pageviewsChartData,
      valueField: 'views',
      chartColor: 'var(--chart-1)',
      isActive: activeMetric === 'pageviews',
      onClick: () => handleMetricChange('pageviews'),
    },
    {
      title: 'Sessions',
      value: summary.sessions.toLocaleString(),
      rawChartData: summary.sessionsChartData,
      valueField: 'sessions',
      chartColor: 'var(--chart-1)',
      isActive: activeMetric === 'sessions',
      onClick: () => handleMetricChange('sessions'),
    },
    {
      title: 'Pages per Session',
      value: summary.pagesPerSession.toLocaleString(),
      rawChartData: summary.pagesPerSessionChartData,
      valueField: 'pages_per_session',
      chartColor: 'var(--chart-1)',
      isActive: activeMetric === 'pagesPerSession',
      onClick: () => handleMetricChange('pagesPerSession'),
    },
    {
      title: t('avgVisitDuration'),
      value: formatDuration(summary.avgVisitDuration),
      rawChartData: summary.avgVisitDurationChartData,
      valueField: 'avg_visit_duration',
      chartColor: 'var(--chart-1)',
      isActive: activeMetric === 'avgDuration',
      onClick: () => handleMetricChange('avgDuration'),
    },
    {
      title: t('bounceRate'),
      value: summary.bounceRate !== undefined ? `${summary.bounceRate}%` : '0%',
      rawChartData: summary.bounceRateChartData,
      valueField: 'bounce_rate',
      chartColor: 'var(--chart-1)',
      isActive: activeMetric === 'bounceRate',
      onClick: () => handleMetricChange('bounceRate'),
    },
  ];

  return (
    <div className='space-y-6'>
      <OverviewChartSection
        activeMetric={activeMetric}
        visitorsData={visitorsData}
        pageviewsData={pageviewsData}
        sessionMetricsData={sessionMetricsData}
        cards={cards}
      />
    </div>
  );
}
