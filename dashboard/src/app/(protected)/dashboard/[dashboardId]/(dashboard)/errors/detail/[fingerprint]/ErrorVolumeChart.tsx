'use client';

import { useId } from 'react';
import { ResponsiveContainer, Area, AreaChart, XAxis, Tooltip } from 'recharts';
import type { ErrorGroupVolumePoint } from '@/entities/analytics/errors.entities';

type ErrorVolumeChartProps = {
  data: ErrorGroupVolumePoint[];
};

export function ErrorVolumeChart({ data }: ErrorVolumeChartProps) {
  const gradientId = useId();

  return (
    <div className='h-24'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`error-volume-${gradientId}`} x1='0' y1='0' x2='0' y2='1'>
              <stop offset='5%' stopColor='var(--destructive)' stopOpacity={0.3} />
              <stop offset='95%' stopColor='var(--destructive)' stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey='date'
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            interval='preserveStartEnd'
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--foreground)',
            }}
            labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '2px' }}
            formatter={(value: number) => [value, 'Errors']}
          />
          <Area
            type='monotone'
            dataKey='count'
            stroke='var(--destructive)'
            strokeWidth={1.5}
            fill={`url(#error-volume-${gradientId})`}
            dot={false}
            activeDot={{ r: 3, fill: 'var(--destructive)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
