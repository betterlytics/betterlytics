'use client';

import { useId } from 'react';
import { Area, AreaChart, Tooltip } from 'recharts';
import type { TimeSeriesPoint } from '@/presenters/toTimeSeries';
import { formatNumber } from '@/utils/formatters';
import { useTranslations } from 'next-intl';

type ErrorSparklineProps = {
  data: TimeSeriesPoint[];
  width?: number;
  height?: number;
};

function SparklineTooltipContent({ active, payload }: { active?: boolean; payload?: { payload: TimeSeriesPoint }[] }) {
  const t = useTranslations('errors.detail.volumeChart');
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const date = new Date(point.date);
  const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div className='bg-popover text-popover-foreground rounded border px-2 py-1 text-xs shadow-sm'>
      <div className='text-muted-foreground'>{label}</div>
      <div className='font-medium'>{t('errorCount', { count: point.count })}</div>
    </div>
  );
}

export function ErrorSparklineChart({ data, width = 160, height = 40 }: ErrorSparklineProps) {
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
      <Tooltip
        content={<SparklineTooltipContent />}
        cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '3 3' }}
      />
      <Area
        type='monotone'
        dataKey='count'
        stroke='var(--chart-error, var(--destructive))'
        strokeWidth={1.5}
        fill={`url(#error-sparkline-${gradientId})`}
        dot={false}
        activeDot={{ r: 2.5, fill: 'var(--chart-error, var(--destructive))', strokeWidth: 0 }}
        isAnimationActive={false}
      />
    </AreaChart>
  );
}
