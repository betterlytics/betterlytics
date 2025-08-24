'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import InteractiveChart from '@/components/InteractiveChart';
import { fetchOutboundClicksChartAction } from '@/app/actions/outboundLinks';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

type OutboundLinksChartSectionProps = {
  outboundClicksChartPromise: ReturnType<typeof fetchOutboundClicksChartAction>;
};

export default function OutboundLinksChartSection({ outboundClicksChartPromise }: OutboundLinksChartSectionProps) {
  const chartData = use(outboundClicksChartPromise);
  const { granularity } = useTimeRangeContext();
  const t = useTranslations('components.outboundLinks.chart');

  return (
    <InteractiveChart
      title={t('title')}
      data={chartData.data}
      color='var(--chart-1)'
      granularity={granularity}
      comparisonMap={chartData.comparisonMap}
    />
  );
}
