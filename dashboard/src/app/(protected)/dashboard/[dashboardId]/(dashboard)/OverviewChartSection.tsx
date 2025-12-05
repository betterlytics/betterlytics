'use client';

import { useMemo, useState, useCallback } from 'react';
import InteractiveChart, { type ChartAnnotation } from '@/components/InteractiveChart';
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

  // POC: Local state for annotations (in real app, this would be persisted to DB)
  const [userAnnotations, setUserAnnotations] = useState<ChartAnnotation[]>([]);

  const allAnnotations: ChartAnnotation[] = useMemo(() => {
    const demoAnnotations: ChartAnnotation[] = [];

    if (chartData && chartData.length >= 5) {
      const idx1 = Math.floor(chartData.length * 0.25);
      const idx2 = Math.floor(chartData.length * 0.75);
      const date1 = chartData[idx1]?.date;
      const date2 = chartData[idx2]?.date;

      if (date1 && date2) {
        demoAnnotations.push(
          {
            id: 'demo-1',
            date: typeof date1 === 'number' ? date1 : new Date(date1).getTime(),
            label: '🚀 v2.0 Launch',
            description: 'Major product update released',
            color: '#10b981',
          },
          {
            id: 'demo-2',
            date: typeof date2 === 'number' ? date2 : new Date(date2).getTime(),
            label: '📧 Newsletter',
            description: 'Monthly newsletter sent to 5k subscribers',
            color: '#8b5cf6',
          },
        );
      }
    }

    return [...demoAnnotations, ...userAnnotations];
  }, [chartData, userAnnotations]);

  const handleAddAnnotation = useCallback((annotation: Omit<ChartAnnotation, 'id'>) => {
    const newAnnotation: ChartAnnotation = {
      ...annotation,
      id: `user-${Date.now()}`,
      color: '#f59e0b',
    };
    setUserAnnotations((prev) => [...prev, newAnnotation]);
  }, []);

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
      annotations={allAnnotations}
      onAddAnnotation={handleAddAnnotation}
    />
  );
}
