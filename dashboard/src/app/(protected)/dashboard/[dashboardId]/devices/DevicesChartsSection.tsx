'use client';

import { use } from 'react';
import DeviceUsageTrendChart from '@/app/(protected)/dashboard/[dashboardId]/devices/DeviceUsageTrendChart';
import { fetchDeviceTypeBreakdownAction, fetchDeviceUsageTrendAction } from '@/app/actions';
import BAPieChart from '@/components/BAPieChart';
import { getDeviceColor, getDeviceLabel } from '@/constants/deviceTypes';
import { DeviceIcon } from '@/components/icons';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className='grid grid-cols-1 gap-3 xl:grid-cols-8'>
      <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4 xl:col-span-5'>
        <CardHeader className='px-0 pb-0'>
          <CardTitle className='text-base font-medium'>{t('deviceUsageTrend')}</CardTitle>
        </CardHeader>
        <CardContent className='px-0'>
          <DeviceUsageTrendChart
            chartData={deviceUsageTrend.data}
            categories={deviceUsageTrend.categories}
            comparisonMap={deviceUsageTrend.comparisonMap}
            granularity={granularity}
          />
        </CardContent>
      </Card>
      <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4 xl:col-span-3'>
        <CardHeader className='px-0 pb-0'>
          <CardTitle className='text-base font-medium'>{t('deviceTypes')}</CardTitle>
        </CardHeader>
        <CardContent className='px-0'>
          <BAPieChart
            data={deviceBreakdown}
            getColor={getDeviceColor}
            getLabel={getDeviceLabel}
            getIcon={(name: string) => <DeviceIcon type={name} className='h-4 w-4' />}
            onSliceClick={makeFilterClick('device_type')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
