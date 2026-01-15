'use client';
import { useState, useCallback, use } from 'react';
import { formatDuration } from '@/utils/dateFormatters';
import {
  fetchSummaryStatsAction,
  fetchUniqueVisitorsAction,
  fetchTotalPageViewsAction,
  fetchSessionMetricsAction,
} from '@/app/actions/index.actions';
import { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import OverviewChartSection from './OverviewChartSection';
import { useTranslations } from 'next-intl';
import { formatNumber } from '@/utils/formatters';

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
      value: formatNumber(summary.uniqueVisitors),
      rawChartData: summary.visitorsChartData,
      valueField: 'unique_visitors',
      comparePercentage: summary.compareValues.uniqueVisitors,
      chartColor: 'var(--chart-1)',
      isActive: activeMetric === 'visitors',
      onClick: () => handleMetricChange('visitors'),
    },
    {
      title: t('totalPageviews'),
      value: formatNumber(summary.pageviews),
      rawChartData: summary.pageviewsChartData,
      valueField: 'views',
      comparePercentage: summary.compareValues.pageviews,
      chartColor: 'var(--chart-1)',
      isActive: activeMetric === 'pageviews',
      onClick: () => handleMetricChange('pageviews'),
    },
    {
      title: t('sessions'),
      value: formatNumber(summary.sessions),
      rawChartData: summary.sessionsChartData,
      valueField: 'sessions',
      comparePercentage: summary.compareValues.sessions,
      chartColor: 'var(--chart-1)',
      isActive: activeMetric === 'sessions',
      onClick: () => handleMetricChange('sessions'),
    },
    {
      title: t('pagesPerSession'),
      value: formatNumber(summary.pagesPerSession),
      rawChartData: summary.pagesPerSessionChartData,
      valueField: 'pages_per_session',
      comparePercentage: summary.compareValues.pagesPerSession,
      chartColor: 'var(--chart-1)',
      isActive: activeMetric === 'pagesPerSession',
      onClick: () => handleMetricChange('pagesPerSession'),
    },
    {
      title: t('avgVisitDuration'),
      value: formatDuration(summary.avgVisitDuration),
      rawChartData: summary.avgVisitDurationChartData,
      valueField: 'avg_visit_duration',
      comparePercentage: summary.compareValues.avgVisitDuration,
      chartColor: 'var(--chart-1)',
      isActive: activeMetric === 'avgDuration',
      onClick: () => handleMetricChange('avgDuration'),
    },
    {
      title: t('bounceRate'),
      value: summary.bounceRate !== undefined ? `${summary.bounceRate}%` : '0%',
      rawChartData: summary.bounceRateChartData,
      valueField: 'bounce_rate',
      comparePercentage: summary.compareValues.bounceRate,
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
