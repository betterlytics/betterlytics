'use client';
import { useState, useCallback } from 'react';
import { useBAQuery } from '@/hooks/useBAQuery';
import { QuerySection } from '@/components/QuerySection';
import { ChartSkeleton } from '@/components/skeleton';
import { formatDuration } from '@/utils/dateFormatters';
import { fetchSummaryAndChartDataAction } from '@/app/actions/index.actions';
import { SummaryCardData } from '@/components/dashboard/SummaryCardsSection';
import OverviewChartSection from './OverviewChartSection';
import { useLocale, useTranslations } from 'next-intl';
import { formatNumber, formatPercentage } from '@/utils/formatters';

type ActiveMetric = 'visitors' | 'sessions' | 'pageviews' | 'bounceRate' | 'avgDuration' | 'pagesPerSession';

export default function SummaryAndChartSection() {
  const query = useBAQuery({
    queryKey: ['summary-chart'],
    queryFn: (dashboardId, q) => fetchSummaryAndChartDataAction(dashboardId, q),
  });
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>('visitors');
  const locale = useLocale();
  const t = useTranslations('dashboard.metrics');

  const handleMetricChange = useCallback((metric: string) => {
    setActiveMetric(metric as ActiveMetric);
  }, []);

  return (
    <QuerySection query={query} fallback={<ChartSkeleton />}>
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
