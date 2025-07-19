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
import { useDictionary } from '@/contexts/DictionaryContextProvider';

type ActiveMetric = 'visitors' | 'pageviews' | 'bounceRate' | 'avgDuration';

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
}: {
  activeMetric: ActiveMetric;
  visitorsData: Awaited<ReturnType<typeof fetchUniqueVisitorsAction>>;
  pageviewsData: Awaited<ReturnType<typeof fetchTotalPageViewsAction>>;
  sessionMetricsData: Awaited<ReturnType<typeof fetchSessionMetricsAction>>;
}) {
  const { dictionary } = useDictionary();

  const metricConfigs: Record<ActiveMetric, MetricConfig> = useMemo(
    () => ({
      visitors: {
        title: dictionary.dashboard.metrics.uniqueVisitors,
        valueField: 'unique_visitors',
        color: 'var(--chart-1)',
      },
      pageviews: {
        title: dictionary.dashboard.metrics.totalPageviews,
        valueField: 'views',
        color: 'var(--chart-2)',
      },
      bounceRate: {
        title: dictionary.dashboard.metrics.bounceRate,
        valueField: 'bounce_rate',
        color: 'var(--chart-3)',
        formatValue: (value: number) => `${value}%`,
      },
      avgDuration: {
        title: dictionary.dashboard.metrics.avgVisitDuration,
        valueField: 'avg_visit_duration',
        color: 'var(--chart-4)',
        formatValue: (value: number) => formatDuration(value),
      },
    }),
    [dictionary],
  );

  const { chartData, comparisonMap } = useMemo(() => {
    switch (activeMetric) {
      case 'visitors':
        return { chartData: visitorsData.data, comparisonMap: visitorsData.comparisonMap };
      case 'pageviews':
        return { chartData: pageviewsData.data, comparisonMap: pageviewsData.comparisonMap };
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
      title={currentMetricConfig.title}
      data={chartData}
      color={currentMetricConfig.color}
      formatValue={currentMetricConfig.formatValue}
      granularity={granularity}
      comparisonMap={comparisonMap}
    />
  );
}
