'use client';

import { useMemo } from 'react';
import InteractiveChart from '@/components/InteractiveChart';
import { formatDuration } from '@/utils/dateFormatters';
import {
  type fetchSessionMetricsAction,
  type fetchTotalPageViewsAction,
  type fetchUniqueVisitorsAction,
} from '@/app/actions/index.action';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useTranslations } from 'next-intl';
import { type SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import InlineMetricsHeader from '@/components/dashboard/InlineMetricsHeader';
import { formatPercentage } from '@/utils/formatters';

type ActiveMetric = 'visitors' | 'sessions' | 'pageviews' | 'bounceRate' | 'avgDuration' | 'pagesPerSession';

interface MetricConfig {
  title: string;
  valueField: string;
  color: string;
  formatValue?: (value: number) => string;
}

export default function OverviewChartSection({
  activeMetric,
  visitorsData,
  pageviewsData,
  sessionMetricsData,
  cards,
}: {
  activeMetric: ActiveMetric;
  visitorsData: Awaited<ReturnType<typeof fetchUniqueVisitorsAction>>;
  pageviewsData: Awaited<ReturnType<typeof fetchTotalPageViewsAction>>;
  sessionMetricsData: Awaited<ReturnType<typeof fetchSessionMetricsAction>>;
  cards?: SummaryCardData[];
}) {
  const t = useTranslations('dashboard');

  const metricConfigs: Record<ActiveMetric, MetricConfig> = useMemo(
    () => ({
      visitors: {
        title: t('metrics.uniqueVisitors'),
        valueField: 'unique_visitors',
        color: 'var(--chart-1)',
      },
      sessions: {
        title: t('metrics.sessions'),
        valueField: 'sessions',
        color: 'var(--chart-1)',
      },
      pagesPerSession: {
        title: t('metrics.pagesPerSession'),
        valueField: 'pages_per_session',
        color: 'var(--chart-1)',
      },
      pageviews: {
        title: t('metrics.totalPageviews'),
        valueField: 'views',
        color: 'var(--chart-1)',
      },
      bounceRate: {
        title: t('metrics.bounceRate'),
        valueField: 'bounce_rate',
        color: 'var(--chart-1)',
        formatValue: formatPercentage,
      },
      avgDuration: {
        title: t('metrics.avgVisitDuration'),
        valueField: 'avg_visit_duration',
        color: 'var(--chart-1)',
        formatValue: formatDuration,
      },
    }),
    [t],
  );

  const { chartData, comparisonMap, incomplete } = useMemo(() => {
    switch (activeMetric) {
      case 'visitors':
        return {
          chartData: visitorsData.data,
          comparisonMap: visitorsData.comparisonMap,
          incomplete: visitorsData.incomplete,
        };
      case 'sessions':
        return {
          chartData: sessionMetricsData.sessions.data,
          comparisonMap: sessionMetricsData.sessions.comparisonMap,
          incomplete: sessionMetricsData.sessions.incomplete,
        };
      case 'pageviews':
        return {
          chartData: pageviewsData.data,
          comparisonMap: pageviewsData.comparisonMap,
          incomplete: pageviewsData.incomplete,
        };
      case 'pagesPerSession':
        return {
          chartData: sessionMetricsData.pagesPerSession.data,
          comparisonMap: sessionMetricsData.pagesPerSession.comparisonMap,
          incomplete: sessionMetricsData.pagesPerSession.incomplete,
        };
      case 'bounceRate':
        return {
          chartData: sessionMetricsData.bounceRate.data,
          comparisonMap: sessionMetricsData.bounceRate.comparisonMap,
          incomplete: sessionMetricsData.bounceRate.incomplete,
        };
      case 'avgDuration':
        return {
          chartData: sessionMetricsData.avgVisitDuration.data,
          comparisonMap: sessionMetricsData.avgVisitDuration.comparisonMap,
          incomplete: sessionMetricsData.avgVisitDuration.incomplete,
        };
      default:
        return { chartData: [], comparisonMap: undefined, incomplete: undefined };
    }
  }, [activeMetric, visitorsData, pageviewsData, sessionMetricsData]);

  const currentMetricConfig = useMemo(() => metricConfigs[activeMetric], [activeMetric, metricConfigs]);
  const { granularity } = useTimeRangeContext();

  return (
    <InteractiveChart
      data={chartData}
      incomplete={incomplete}
      color={currentMetricConfig.color}
      formatValue={currentMetricConfig.formatValue}
      granularity={granularity}
      comparisonMap={comparisonMap}
      headerContent={cards ? <InlineMetricsHeader cards={cards} /> : undefined}
      tooltipTitle={currentMetricConfig.title}
      labelPaddingLeft={activeMetric === 'avgDuration' ? 20 : undefined}
    />
  );
}
