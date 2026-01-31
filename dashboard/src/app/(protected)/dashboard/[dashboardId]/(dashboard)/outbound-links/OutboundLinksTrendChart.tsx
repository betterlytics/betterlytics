'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Line,
} from 'recharts';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { type ComparisonMapping } from '@/types/charts';
import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { defaultDateLabelFormatter } from '@/utils/chartUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocale, useTranslations } from 'next-intl';
import { formatNumber } from '@/utils/formatters';
import { format } from 'date-fns';
import DataEmptyComponent from '@/components/DataEmptyComponent';

interface OutboundLinksTrendChartProps {
  chartData: Array<{ date: number; value: (number | null)[] }>;
  incomplete?: Array<{ date: number; value: (number | null)[] }>;
  comparisonMap?: ComparisonMapping[];
  granularity?: GranularityRangeValues;
  color: string;
  tooltipTitle?: string;
  formatValue?: (value: number) => string;
}

export default function OutboundLinksTrendChart({
  chartData,
  incomplete,
  comparisonMap,
  granularity,
  color,
  tooltipTitle,
  formatValue,
}: OutboundLinksTrendChartProps) {
  const t = useTranslations('dashboard.emptyStates');
  const locale = useLocale();
  const isMobile = useIsMobile();

  if (!chartData || chartData.length === 0) {
    return (
      <DataEmptyComponent />
    );
  }

  return (
    <div className='h-[300px] w-full'>
      <ResponsiveContainer width='100%' height='100%' className='mt-4'>
        <ComposedChart data={chartData} margin={{ top: 10, bottom: 0, right: 1 }}>
          <defs>
            <linearGradient id={`gradient-outbound`} x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor={color} stopOpacity={0.3} />
              <stop offset='95%' stopColor={color} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`gradient-outbound-incomplete`} x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor={color} stopOpacity={0.09} />
              <stop offset='95%' stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
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
            allowDuplicatedCategory={false}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            className='text-muted-foreground'
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            tickFormatter={formatNumber}
            width={40}
            mirror={isMobile}
          />
          <RechartsTooltip
            content={
              <ChartTooltip
                labelFormatter={(date) => defaultDateLabelFormatter(date, granularity, locale)}
                formatter={formatValue ?? formatNumber}
                comparisonMap={comparisonMap}
                title={tooltipTitle}
              />
            }
          />

          <Area
            type='linear'
            data={chartData}
            dataKey={'value.0'}
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill={'url(#gradient-outbound)'}
          />
          {incomplete && incomplete.length >= 2 ? (
            <Area
              type='linear'
              data={incomplete}
              dataKey={'value.0'}
              stroke='none'
              fillOpacity={1}
              fill={'url(#gradient-outbound-incomplete)'}
            />
          ) : null}
          {incomplete && incomplete.length >= 2 ? (
            <Line
              type='linear'
              data={incomplete}
              dataKey={'value.0'}
              stroke={color}
              strokeWidth={2}
              strokeDasharray='4 4'
              dot={false}
            />
          ) : null}
          <Line
            type='linear'
            dataKey={'value.1'}
            stroke={'var(--chart-comparison)'}
            strokeWidth={2}
            strokeOpacity={0.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
