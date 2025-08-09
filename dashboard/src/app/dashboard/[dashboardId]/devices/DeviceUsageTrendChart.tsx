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
import React from 'react';
import { getDeviceColor } from '@/utils/deviceColors';
import { DeviceIcon } from '@/components/icons';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { StackedAreaChartTooltip } from '@/components/charts/StackedAreaChartTooltip';
import { format } from 'date-fns';
import { type ComparisonMapping } from '@/types/charts';
import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

interface DeviceUsageTrendChartProps {
  chartData: Array<{ date: number } & Record<string, number>>;
  categories: string[];
  comparisonMap?: ComparisonMapping[];
  granularity?: GranularityRangeValues;
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

export default function DeviceUsageTrendChart({
  chartData,
  categories,
  comparisonMap,
  granularity,
}: DeviceUsageTrendChartProps) {
  const { dictionary } = useDictionary();
  
  if (!chartData || chartData.length === 0 || categories.length === 0) {
    return (
      <div className='flex h-[300px] items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground mb-1'>{dictionary.t('components.devices.trends.noData')}</p>
          <p className='text-muted-foreground/70 text-xs'>{dictionary.t('components.devices.trends.adjustTimeRange')}</p>
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
            <RechartsTooltip
              content={(props) => (
                <StackedAreaChartTooltip
                  active={props.active}
                  payload={props.payload}
                  label={props.label}
                  comparisonMap={comparisonMap}
                  granularity={granularity}
                  formatter={(value) => value.toLocaleString()}
                />
              )}
            />

            {categories.map((deviceType) => (
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
      <CustomLegend deviceTypes={categories} />
    </div>
  );
}
