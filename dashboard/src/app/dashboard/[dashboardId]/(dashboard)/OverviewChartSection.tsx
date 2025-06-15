'use client';

import { useMemo } from 'react';
import InteractiveChart from '@/components/InteractiveChart';
import { formatDuration } from '@/utils/dateFormatters';
import {
  type fetchSessionMetricsAction,
  type fetchTotalPageViewsAction,
  type fetchUniqueVisitorsAction,
} from '@/app/actions';

type ActiveMetric = 'visitors' | 'pageviews' | 'bounceRate' | 'avgDuration';

interface MetricConfig {
  title: string;
  valueField: string;
  color: string;
  formatValue?: (value: number) => string;
}

const metricConfigs: Record<ActiveMetric, MetricConfig> = {
  visitors: {
    title: 'Unique Visitors',
    valueField: 'unique_visitors',
    color: 'var(--chart-1)',
  },
  pageviews: {
    title: 'Total Pageviews',
    valueField: 'views',
    color: 'var(--chart-2)',
  },
  bounceRate: {
    title: 'Bounce Rate',
    valueField: 'bounce_rate',
    color: 'var(--chart-3)',
    formatValue: (value: number) => `${value}%`,
  },
  avgDuration: {
    title: 'Average Visit Duration',
    valueField: 'avg_visit_duration',
    color: 'var(--chart-4)',
    formatValue: (value: number) => formatDuration(value),
  },
};

type OverviewChartSectionProps = {
  activeMetric: ActiveMetric;
  visitorsData: Awaited<ReturnType<typeof fetchUniqueVisitorsAction>>;
  pageviewsData: Awaited<ReturnType<typeof fetchTotalPageViewsAction>>;
  sessionMetricsData: Awaited<ReturnType<typeof fetchSessionMetricsAction>>;
};

export default function OverviewChartSection({
  activeMetric,
  visitorsData,
  pageviewsData,
  sessionMetricsData,
}: OverviewChartSectionProps) {
  const chartData = useMemo(() => {
    switch (activeMetric) {
      case 'visitors':
        return visitorsData || [];
      case 'pageviews':
        return pageviewsData || [];
      case 'bounceRate':
        return sessionMetricsData || [];
      case 'avgDuration':
        return sessionMetricsData || [];
      default:
        return [];
    }
  }, [activeMetric, visitorsData, pageviewsData, sessionMetricsData]);

  const currentMetricConfig = useMemo(() => metricConfigs[activeMetric], [activeMetric]);

  return (
    <InteractiveChart
      title={currentMetricConfig.title}
      data={chartData}
      valueField={currentMetricConfig.valueField}
      color={currentMetricConfig.color}
      formatValue={currentMetricConfig.formatValue}
    />
  );
}
