'use client';
import { useState, useCallback } from 'react';
import { QuerySection } from '@/components/QuerySection';
import { ChartSkeleton } from '@/components/skeleton';
import { formatDuration } from '@/utils/dateFormatters';
import { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import OverviewChartSection from './OverviewChartSection';
import { useLocale, useTranslations } from 'next-intl';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import InlineMetricsHeaderSkeleton from '@/components/skeleton/InlineMetricsHeaderSkeleton';

type ActiveMetric = 'visitors' | 'sessions' | 'pageviews' | 'bounceRate' | 'avgDuration' | 'pagesPerSession';

const METRIC_KEYS = [
  'uniqueVisitors',
  'totalPageviews',
  'sessions',
  'pagesPerSession',
  'avgVisitDuration',
  'bounceRate',
] as const;

export default function SummaryAndChartSection() {
  const { input, options } = useBAQueryParams();
  const query = trpc.overview.summaryAndChart.useQuery(input, options);
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>('visitors');
  const locale = useLocale();
  const t = useTranslations('dashboard.metrics');

  const handleMetricChange = useCallback((metric: string) => {
    setActiveMetric(metric as ActiveMetric);
  }, []);

  return (
    <QuerySection
      query={query}
      fallback={
        <ChartSkeleton title={<InlineMetricsHeaderSkeleton titles={METRIC_KEYS.map((key) => t(key))} />} />
      }
    >
      {(summaryData) => {
        const cards: SummaryCardData[] = [
          {
            title: t('uniqueVisitors'),
            value: formatNumber(summaryData.uniqueVisitors, locale),
            rawChartData: summaryData.visitorsChartData,
            valueField: 'unique_visitors',
            comparePercentage: summaryData.compareValues.uniqueVisitors,
            chartColor: 'var(--chart-1)',
            isActive: activeMetric === 'visitors',
            onClick: () => handleMetricChange('visitors'),
          },
          {
            title: t('totalPageviews'),
            value: formatNumber(summaryData.pageviews, locale),
            rawChartData: summaryData.pageviewsChartData,
            valueField: 'views',
            comparePercentage: summaryData.compareValues.pageviews,
            chartColor: 'var(--chart-1)',
            isActive: activeMetric === 'pageviews',
            onClick: () => handleMetricChange('pageviews'),
          },
          {
            title: t('sessions'),
            value: formatNumber(summaryData.sessions, locale),
            rawChartData: summaryData.sessionsChartData,
            valueField: 'sessions',
            comparePercentage: summaryData.compareValues.sessions,
            chartColor: 'var(--chart-1)',
            isActive: activeMetric === 'sessions',
            onClick: () => handleMetricChange('sessions'),
          },
          {
            title: t('pagesPerSession'),
            value: formatNumber(summaryData.pagesPerSession, locale),
            rawChartData: summaryData.pagesPerSessionChartData,
            valueField: 'pages_per_session',
            comparePercentage: summaryData.compareValues.pagesPerSession,
            chartColor: 'var(--chart-1)',
            isActive: activeMetric === 'pagesPerSession',
            onClick: () => handleMetricChange('pagesPerSession'),
          },
          {
            title: t('avgVisitDuration'),
            value: formatDuration(summaryData.avgVisitDuration, locale),
            rawChartData: summaryData.avgVisitDurationChartData,
            valueField: 'avg_visit_duration',
            comparePercentage: summaryData.compareValues.avgVisitDuration,
            chartColor: 'var(--chart-1)',
            isActive: activeMetric === 'avgDuration',
            onClick: () => handleMetricChange('avgDuration'),
          },
          {
            title: t('bounceRate'),
            value: formatPercentage(summaryData.bounceRate ?? 0, locale),
            rawChartData: summaryData.bounceRateChartData,
            valueField: 'bounce_rate',
            comparePercentage: summaryData.compareValues.bounceRate,
            chartColor: 'var(--chart-1)',
            isActive: activeMetric === 'bounceRate',
            onClick: () => handleMetricChange('bounceRate'),
          },
        ];

        return (
          <div className='space-y-6'>
            <OverviewChartSection
              activeMetric={activeMetric}
              visitorsData={summaryData.visitorsAreaChart}
              pageviewsData={summaryData.pageviewsAreaChart}
              sessionMetricsData={summaryData.sessionMetrics}
              cards={cards}
            />
          </div>
        );
      }}
    </QuerySection>
  );
}
