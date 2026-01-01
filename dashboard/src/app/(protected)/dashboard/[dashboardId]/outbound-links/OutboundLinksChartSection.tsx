'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
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
    <Card variant='section' minHeight='chart'>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
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
