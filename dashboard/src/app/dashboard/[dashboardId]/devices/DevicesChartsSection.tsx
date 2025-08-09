'use client';

import { use } from 'react';
import DeviceUsageTrendChart from '@/app/dashboard/[dashboardId]/devices/DeviceUsageTrendChart';
import { fetchDeviceTypeBreakdownAction, fetchDeviceUsageTrendAction } from '@/app/actions';
import BAPieChart from '@/components/BAPieChart';
import { getDeviceColor, getDeviceLabel } from '@/constants/deviceTypes';
import { DeviceIcon } from '@/components/icons';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

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
  const { dictionary } = useDictionary();

  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
      <div className='bg-card border-border rounded-lg border p-6 shadow'>
        <h2 className='text-foreground mb-1 text-lg font-bold'>{dictionary.t('components.devices.charts.deviceTypes')}</h2>
        <p className='text-muted-foreground mb-4 text-sm'>{dictionary.t('components.devices.charts.visitorsByDeviceCategory')}</p>
        <BAPieChart
          data={deviceBreakdown}
          getColor={getDeviceColor}
          getLabel={getDeviceLabel}
          getIcon={(name: string) => <DeviceIcon type={name} className='h-4 w-4' />}
        />
      </div>
      <div className='bg-card border-border rounded-lg border p-6 shadow'>
        <h2 className='text-foreground mb-1 text-lg font-bold'>{dictionary.t('components.devices.charts.deviceUsageTrend')}</h2>
        <p className='text-muted-foreground mb-4 text-sm'>{dictionary.t('components.devices.charts.visitorTrendsByDeviceType')}</p>
        <DeviceUsageTrendChart
          chartData={deviceUsageTrend.data}
          categories={deviceUsageTrend.categories}
          comparisonMap={deviceUsageTrend.comparisonMap}
          granularity={granularity}
        />
      </div>
    </div>
  );
}
