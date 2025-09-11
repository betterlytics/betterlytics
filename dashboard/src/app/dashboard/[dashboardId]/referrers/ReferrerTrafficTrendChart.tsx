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
import { useTranslations } from 'next-intl';
import { useIsMobile } from '@/hooks/use-mobile';

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
    <div className='mt-10 h-[300px] w-full'>
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
            tickFormatter={(value) => value.toLocaleString()}
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
