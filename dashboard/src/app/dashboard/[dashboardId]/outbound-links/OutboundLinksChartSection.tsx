'use client';

import { use } from 'react';
import InteractiveChart from '@/components/InteractiveChart';
import { fetchOutboundClicksChartAction } from '@/app/actions/outboundLinks';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

type OutboundLinksChartSectionProps = {
  outboundClicksChartPromise: ReturnType<typeof fetchOutboundClicksChartAction>;
};

export default function OutboundLinksChartSection({ outboundClicksChartPromise }: OutboundLinksChartSectionProps) {
  const chartData = use(outboundClicksChartPromise);
  const { granularity } = useTimeRangeContext();

  return (
    <InteractiveChart
      title='Unique Outbound Clicks Over Time'
      data={chartData.data}
      color='var(--chart-1)'
      granularity={granularity}
      comparisonMap={chartData.comparisonMap}
    />
  );
}
