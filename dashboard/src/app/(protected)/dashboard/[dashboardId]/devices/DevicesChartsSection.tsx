'use client';

import { use } from 'react';
import DeviceUsageTrendChart from '@/app/(protected)/dashboard/[dashboardId]/devices/DeviceUsageTrendChart';
import { fetchDeviceTypeBreakdownAction, fetchDeviceUsageTrendAction } from '@/app/actions/index.actions';
import BAPieChart from '@/components/BAPieChart';
import { getDeviceColor, getDeviceLabel } from '@/constants/deviceTypes';
import { DeviceIcon } from '@/components/icons';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Grid } from '@/components/layout';
import { useFilterClick } from '@/hooks/use-filter-click';

type DevicesChartsSectionProps = {
  deviceBreakdownPromise: ReturnType<typeof fetchDeviceTypeBreakdownAction>;
  deviceUsageTrendPromise: ReturnType<typeof fetchDeviceUsageTrendAction>;
};

export default function DevicesChartsSection({
  deviceBreakdownPromise,
  deviceUsageTrendPromise,
}: DevicesChartsSectionProps) {
  const deviceBreakdown = use(deviceBreakdownPromise);
  const deviceUsageTrend = use(deviceUsageTrendPromise);
  const { granularity } = useTimeRangeContext();
  const t = useTranslations('components.devices.charts');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  return (
    <Grid cols={{ base: 1, xl: 8 }}>
      <Card variant='section' minHeight='chart' className='xl:col-span-5'>
        <CardHeader>
          <CardTitle>{t('deviceUsageTrend')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DeviceUsageTrendChart
            chartData={deviceUsageTrend.data}
            categories={deviceUsageTrend.categories}
            comparisonMap={deviceUsageTrend.comparisonMap}
            granularity={granularity}
          />
        </CardContent>
      </Card>
      <Card variant='section' minHeight='chart' className='xl:col-span-3'>
        <CardHeader>
          <CardTitle>{t('deviceTypes')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BAPieChart
            data={deviceBreakdown}
            getColor={getDeviceColor}
            getLabel={getDeviceLabel}
            getIcon={(name: string) => <DeviceIcon type={name} className='h-4 w-4' />}
            onSliceClick={makeFilterClick('device_type')}
          />
        </CardContent>
      </Card>
    </Grid>
  );
}
