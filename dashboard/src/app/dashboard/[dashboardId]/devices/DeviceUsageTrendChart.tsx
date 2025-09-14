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
import { getDeviceColor } from '@/constants/deviceTypes';
import { DeviceIcon } from '@/components/icons';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { StackedAreaChartTooltip } from '@/components/charts/StackedAreaChartTooltip';
import { format } from 'date-fns';
import { type ComparisonMapping } from '@/types/charts';
import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { useTranslations } from 'next-intl';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const t = useTranslations('dashboard.emptyStates');
  const isMobile = useIsMobile();

  if (!chartData || chartData.length === 0 || categories.length === 0) {
    return (
      <div className='flex h-[300px] items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground mb-1'>{t('noData')}</p>
          <p className='text-muted-foreground/70 text-xs'>{t('adjustTimeRange')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mt-10 w-full'>
      <div className='h-[250px] w-full'>
        <ResponsiveContainer width='100%' height='100%' className='mt-4'>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: isMobile ? 4 : 22, left: isMobile ? 4 : 22, bottom: 0 }}
          >
            <CartesianGrid className='opacity-10' vertical={false} strokeWidth={1.5} />
            <XAxis
              dataKey='date'
              tickLine={false}
              axisLine={false}
              className='text-muted-foreground'
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              tickMargin={6}
              minTickGap={100}
              tickFormatter={(value) => format(new Date(value), 'MMM dd')}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className='text-muted-foreground'
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              tickFormatter={(val) => val.toLocaleString()}
              width={40}
              mirror={isMobile}
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
