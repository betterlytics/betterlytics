'use client';

import { useMemo } from 'react';
import InteractiveChart from '@/components/InteractiveChart';
import { formatDuration } from '@/utils/dateFormatters';
import { formatPercentage } from '@/utils/formatters';
import { DailyUniqueVisitorsRow } from '@/entities/visitors';
import { TotalPageViewsRow } from '@/entities/pageviews';
import { DailySessionMetricsRow } from '@/entities/sessionMetrics';

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
    formatValue: (value: number) => formatPercentage(value),
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
  visitorsData: DailyUniqueVisitorsRow[];
  pageviewsData: TotalPageViewsRow[];
  sessionMetricsData: DailySessionMetricsRow[];
  comparisonVisitorsData?: DailyUniqueVisitorsRow[];
  comparisonPageviewsData?: TotalPageViewsRow[];
  comparisonSessionMetricsData?: DailySessionMetricsRow[];
  showComparison?: boolean;
};

export default function OverviewChartSection({
  activeMetric,
  visitorsData,
  pageviewsData,
  sessionMetricsData,
  comparisonVisitorsData,
  comparisonPageviewsData,
  comparisonSessionMetricsData,
  showComparison = false,
}: OverviewChartSectionProps) {
  const getDataForMetric = useMemo(() => {
    const dataMap = {
      visitors: { current: visitorsData, comparison: comparisonVisitorsData },
      pageviews: { current: pageviewsData, comparison: comparisonPageviewsData },
      bounceRate: { current: sessionMetricsData, comparison: comparisonSessionMetricsData },
      avgDuration: { current: sessionMetricsData, comparison: comparisonSessionMetricsData },
    };
    return dataMap[activeMetric];
  }, [
    activeMetric,
    visitorsData,
    pageviewsData,
    sessionMetricsData,
    comparisonVisitorsData,
    comparisonPageviewsData,
    comparisonSessionMetricsData,
  ]);

  const chartData = getDataForMetric.current || [];
  const comparisonChartData = showComparison ? getDataForMetric.comparison || [] : undefined;
  const currentMetricConfig = metricConfigs[activeMetric];

  return (
    <InteractiveChart
      title={currentMetricConfig.title}
      data={chartData}
      valueField={currentMetricConfig.valueField}
      color={currentMetricConfig.color}
      formatValue={currentMetricConfig.formatValue}
      comparisonData={comparisonChartData}
      comparisonValueField={currentMetricConfig.valueField}
      showComparison={showComparison && !!comparisonChartData}
    />
  );
}
