'use client';

import { useTranslations } from 'next-intl';
import InteractiveChart from '@/components/InteractiveChart';
import DataEmptyComponent from '@/components/DataEmptyComponent';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useBAQuery } from '@/trpc/hooks';
import { QuerySection } from '@/components/QuerySection';
import { ChartSkeleton } from '@/components/skeleton';

export default function OutboundLinksChartSection() {
  const query = useBAQuery((t, input, opts) => t.outboundLinks.clicksChart.useQuery(input, opts));
  const { granularity } = useTimeRangeContext();
  const t = useTranslations('components.outboundLinks.chart');

  return (
    <QuerySection query={query} fallback={<ChartSkeleton />}>
      {(chartData) => {
        if (!chartData.data || chartData.data.length === 0) {
          return <DataEmptyComponent />;
        }

        return (
          <InteractiveChart
            data={chartData.data}
            incomplete={chartData.incomplete}
            incompleteStart={chartData.incompleteStart}
            color='var(--chart-1)'
            granularity={granularity}
            comparisonMap={chartData.comparisonMap}
            tooltipTitle={t('tooltipTitle')}
            headerContent={<h3 className='text-base font-medium'>{t('title')}</h3>}
          />
        );
      }}
    </QuerySection>
  );
}
