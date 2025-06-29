'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { getReferrerColor } from '@/utils/referrerColors';
import { format } from 'date-fns';
import ReferrerLegend from './ReferrerLegend';
import { StackedAreaChartTooltip } from '@/components/charts/StackedAreaChartTooltip';
import { type ComparisonMapping } from '@/types/charts';
import { type GranularityRangeValues } from '@/utils/granularityRanges';

interface ReferrerTrafficTrendChartProps {
  chartData: Array<{ date: number } & Record<string, number>>;
  categories: string[];
  comparisonMap?: ComparisonMapping[];
  granularity?: GranularityRangeValues;
}

export default function ReferrerTrafficTrendChart({
  chartData,
  categories,
  comparisonMap,
  granularity,
}: ReferrerTrafficTrendChartProps) {
  if (!chartData || chartData.length === 0 || categories.length === 0) {
    return (
      <div className='flex h-[300px] items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground mb-1'>No trend data available</p>
          <p className='text-muted-foreground/70 text-xs'>Try adjusting the time range or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-[300px] w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='var(--color-border)' />
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
            tickFormatter={(value) => value.toLocaleString()}
          />
          <RechartsTooltip
            content={(props) => (
              <StackedAreaChartTooltip
                active={props.active}
                payload={props.payload}
                label={props.label}
                comparisonMap={comparisonMap}
                granularity={granularity}
                formatter={(value: number) => `${value.toLocaleString()} visitors`}
              />
            )}
          />
          <Legend content={<ReferrerLegend showPercentage={false} />} verticalAlign='bottom' />

          {categories.map((source) => (
            <Area
              key={source}
              type='monotone'
              dataKey={source}
              stackId='1'
              stroke={getReferrerColor(source)}
              fill={getReferrerColor(source)}
              fillOpacity={0.6}
              name={source}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
