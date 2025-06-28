'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import React, { useMemo } from 'react';
import { DeviceUsageTrendRow } from '@/entities/devices';
import { getDeviceColor } from '@/utils/deviceColors';
import { DeviceIcon } from '@/components/icons';
import { format } from 'date-fns';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { sortByDate } from '@/utils/dateHelpers';

interface DeviceUsageTrendChartProps {
  data?: DeviceUsageTrendRow[];
}

const CustomLegend = React.memo(({ deviceTypes }: { deviceTypes: string[] }) => (
  <div className='mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2'>
    {deviceTypes.map((deviceType) => (
      <div key={deviceType} className='flex items-center gap-1 text-sm'>
        <span
          className='inline-block h-3 w-3 rounded-full'
          style={{ backgroundColor: getDeviceColor(deviceType) }}
        />
        <DeviceIcon type={deviceType} className='h-4 w-4' />
        <span className='text-foreground font-medium'>{capitalizeFirstLetter(deviceType)}</span>
      </div>
    ))}
  </div>
));

CustomLegend.displayName = 'CustomLegend';

const calculateDeviceTypeTotals = (data: DeviceUsageTrendRow[]): Record<string, number> => {
  if (!data || data.length === 0) {
    return {};
  }
  return data.reduce(
    (acc, item) => {
      acc[item.device_type] = (acc[item.device_type] || 0) + item.count;
      return acc;
    },
    {} as Record<string, number>,
  );
};

const getSortedDeviceTypes = (data: DeviceUsageTrendRow[], deviceTypeTotals: Record<string, number>): string[] => {
  if (!data || data.length === 0) {
    return [];
  }
  return Array.from(new Set(data.map((item) => item.device_type))).sort(
    (a, b) => (deviceTypeTotals[b] || 0) - (deviceTypeTotals[a] || 0),
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className='rounded-md border border-gray-200 bg-white p-2 shadow-lg'>
        <p className='text-xs text-gray-500'>{format(new Date(label), 'MMM dd, yyyy HH:mm')}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className='text-sm text-gray-700' style={{ color: entry.color }}>
            {`${capitalizeFirstLetter(entry.name)}: ${entry.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

CustomTooltip.displayName = 'CustomTooltip';

const prepareChartData = (
  rawData: DeviceUsageTrendRow[],
  allDeviceTypes: string[],
): Array<Record<string, any>> => {
  if (!rawData || rawData.length === 0 || !allDeviceTypes || allDeviceTypes.length === 0) {
    return [];
  }

  const dataByDate: Record<string, Record<string, any>> = {};

  rawData.forEach((item) => {
    const { date } = item;
    if (!dataByDate[date]) {
      dataByDate[date] = { date };
      allDeviceTypes.forEach((deviceType) => {
        dataByDate[date][deviceType] = 0;
      });
    }
  });

  rawData.forEach((item) => {
    const { date, device_type, count } = item;
    if (dataByDate[date]) {
      dataByDate[date][device_type] = count;
    }
  });

  return sortByDate(Object.values(dataByDate) as Array<{ date: string } & Record<string, number>>);
};

export default function DeviceUsageTrendChart({ data }: DeviceUsageTrendChartProps) {
  const deviceTypeTotals = useMemo(() => calculateDeviceTypeTotals(data || []), [data]);

  const sortedDeviceTypes = useMemo(
    () => getSortedDeviceTypes(data || [], deviceTypeTotals),
    [data, deviceTypeTotals],
  );

  const chartData = useMemo(() => {
    if (!data || data.length === 0 || sortedDeviceTypes.length === 0) {
      return [];
    }
    return prepareChartData(data, sortedDeviceTypes);
  }, [data, sortedDeviceTypes]);

  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div className='flex h-[300px] items-center justify-center'>
        <div className='text-center'>
          <p className='mb-1 text-gray-500'>No device trend data available</p>
          <p className='text-xs text-gray-400'>Try adjusting the time range or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full'>
      <div className='h-[250px] w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#f1f5f9' />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickMargin={10}
              tickFormatter={(value) => format(new Date(value), 'MMM dd')}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickMargin={10}
              tickFormatter={(val) => val.toLocaleString()}
            />
            <RechartsTooltip content={<CustomTooltip />} />

            {sortedDeviceTypes.map((deviceType) => (
              <Area
                key={deviceType}
                type='monotone'
                dataKey={deviceType}
                stackId='1'
                stroke={getDeviceColor(deviceType)}
                fill={getDeviceColor(deviceType)}
                fillOpacity={0.7}
                name={capitalizeFirstLetter(deviceType)}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <CustomLegend deviceTypes={sortedDeviceTypes} />
    </div>
  );
}
