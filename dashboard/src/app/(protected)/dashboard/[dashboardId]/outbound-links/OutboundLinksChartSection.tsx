'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OutboundLinksTrendChart from '@/app/(protected)/dashboard/[dashboardId]/outbound-links/OutboundLinksTrendChart';
import { fetchOutboundClicksChartAction } from '@/app/actions/analytics/outboundLinks.actions';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

type OutboundLinksChartSectionProps = {
  outboundClicksChartPromise: ReturnType<typeof fetchOutboundClicksChartAction>;
};

export default function OutboundLinksChartSection({ outboundClicksChartPromise }: OutboundLinksChartSectionProps) {
  const chartData = use(outboundClicksChartPromise);
  const { granularity } = useTimeRangeContext();
  const t = useTranslations('components.outboundLinks.chart');

  return (
    <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
      <CardHeader className='px-0 pb-0'>
        <CardTitle className='text-base font-medium'>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className='mt-4 px-0'>
        <OutboundLinksTrendChart
          chartData={chartData.data}
          comparisonMap={chartData.comparisonMap}
          granularity={granularity}
          color='var(--chart-1)'
          tooltipTitle={t('tooltipTitle')}
        />
      </CardContent>
    </Card>
  );
}
