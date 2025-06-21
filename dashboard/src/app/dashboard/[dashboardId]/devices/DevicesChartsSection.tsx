'use client';

import { use } from 'react';
import { fetchDeviceTypeBreakdownAction, fetchDeviceUsageTrendAction } from '@/app/actions';
import InteractivePieChart from '@/components/InteractivePieChart';
import { getDeviceColor, getDeviceLabel } from '@/constants/deviceTypes';
import { DeviceIcon } from '@/components/icons';
import InteractiveStackedChart from '@/components/InteractiveStackedChart';
import { capitalizeFirstLetter } from '@/utils/formatters';

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

  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
      <div className='bg-card border-border rounded-lg border p-6 shadow'>
        <h2 className='text-foreground mb-1 text-lg font-bold'>Device Types</h2>
        <p className='text-muted-foreground mb-4 text-sm'>Visitors by device category</p>
        <InteractivePieChart
          data={deviceBreakdown}
          getColor={getDeviceColor}
          getLabel={getDeviceLabel}
          getIcon={(name: string) => <DeviceIcon type={name} className='h-4 w-4' />}
        />
      </div>
      <div className='bg-card border-border rounded-lg border p-6 shadow'>
        <h2 className='text-foreground mb-1 text-lg font-bold'>Device Usage Trend</h2>
        <p className='text-muted-foreground mb-4 text-sm'>Visitor trends by device type</p>
        {/* <DeviceUsageTrendChart data={deviceUsageTrend} /> */}
        <InteractiveStackedChart
          data={deviceUsageTrend}
          getColor={getDeviceColor}
          formatLabel={capitalizeFirstLetter}
        />
      </div>
    </div>
  );
}
