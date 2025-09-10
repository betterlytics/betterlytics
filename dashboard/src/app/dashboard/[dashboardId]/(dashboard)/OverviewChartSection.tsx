'use client';

import { useMemo } from 'react';
import InteractiveChart from '@/components/InteractiveChart';
import { formatDuration } from '@/utils/dateFormatters';
import {
  type fetchSessionMetricsAction,
  type fetchTotalPageViewsAction,
  type fetchUniqueVisitorsAction,
} from '@/app/actions';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useTranslations } from 'next-intl';
import { type SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import InlineMetricsHeader from '@/components/dashboard/InlineMetricsHeader';

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
        title: 'Sessions',
        valueField: 'sessions',
        color: 'var(--chart-1)',
      },
      pagesPerSession: {
        title: 'Pages per Session',
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
        formatValue: (value: number) => `${value}%`,
      },
      avgDuration: {
        title: t('metrics.avgVisitDuration'),
        valueField: 'avg_visit_duration',
        color: 'var(--chart-1)',
        formatValue: (value: number) => formatDuration(value),
      },
    }),
    [t],
  );

  const { chartData, comparisonMap } = useMemo(() => {
    switch (activeMetric) {
      case 'visitors':
        return { chartData: visitorsData.data, comparisonMap: visitorsData.comparisonMap };
      case 'sessions':
        return {
          chartData: sessionMetricsData.sessions.data,
          comparisonMap: sessionMetricsData.sessions.comparisonMap,
        };
      case 'pageviews':
        return { chartData: pageviewsData.data, comparisonMap: pageviewsData.comparisonMap };
      case 'pagesPerSession':
        return {
          chartData: sessionMetricsData.pagesPerSession.data,
          comparisonMap: sessionMetricsData.pagesPerSession.comparisonMap,
        };
      case 'bounceRate':
        return {
          chartData: sessionMetricsData.bounceRate.data,
          comparisonMap: sessionMetricsData.bounceRate.comparisonMap,
        };
      case 'avgDuration':
        return {
          chartData: sessionMetricsData.avgVisitDuration.data,
          comparisonMap: sessionMetricsData.avgVisitDuration.comparisonMap,
        };
      default:
        return { chartData: [], comparisonMap: undefined };
    }
  }, [activeMetric, visitorsData, pageviewsData, sessionMetricsData]);

  const currentMetricConfig = useMemo(() => metricConfigs[activeMetric], [activeMetric, metricConfigs]);
  const { granularity } = useTimeRangeContext();

  return (
    <InteractiveChart
      title={undefined}
      data={chartData}
      color={currentMetricConfig.color}
      formatValue={currentMetricConfig.formatValue}
      granularity={granularity}
      comparisonMap={comparisonMap}
      headerContent={cards ? <InlineMetricsHeader cards={cards} /> : undefined}
      tooltipTitle={currentMetricConfig.title}
    />
  );
}
