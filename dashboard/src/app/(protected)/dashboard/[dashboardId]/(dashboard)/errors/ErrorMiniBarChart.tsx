'use client';

import { BarChart, Bar } from 'recharts';
import type { BarChartPoint } from '@/presenters/toBarChart';

type ErrorMiniBarChartProps = {
  data: BarChartPoint[];
  width?: number;
  height?: number;
};

export function ErrorMiniBarChart({ data, width = 160, height = 40 }: ErrorMiniBarChartProps) {
  if (data.length === 0) return null;

  return (
    <BarChart width={width} height={height} data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
      <Bar dataKey='count' fill='var(--color-destructive)' opacity={0.7} radius={[1, 1, 0, 0]} />
    </BarChart>
  );
}
