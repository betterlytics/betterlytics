'use client';

import { useId } from 'react';
import { Area, AreaChart } from 'recharts';
import type { BarChartPoint } from '@/presenters/toBarChart';

type ErrorSparklineProps = {
  data: BarChartPoint[];
  width?: number;
  height?: number;
};

export function ErrorMiniBarChart({ data, width = 160, height = 40 }: ErrorSparklineProps) {
  const gradientId = useId();

  if (data.length === 0) return null;

  return (
    <AreaChart width={width} height={height} data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
      <defs>
        <linearGradient id={`error-sparkline-${gradientId}`} x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor='var(--chart-error, var(--destructive))' stopOpacity={0.4} />
          <stop offset='100%' stopColor='var(--chart-error, var(--destructive))' stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <Area
        type='monotone'
        dataKey='count'
        stroke='var(--chart-error, var(--destructive))'
        strokeWidth={1.5}
        fill={`url(#error-sparkline-${gradientId})`}
        dot={false}
        activeDot={false}
        isAnimationActive={false}
      />
    </AreaChart>
  );
}
