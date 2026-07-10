'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, Bar, BarChart, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import type { ErrorGroupVolumePoint } from '@/entities/analytics/errors.entities';
import { useTranslations } from 'next-intl';

type ErrorVolumeChartProps = {
  data: ErrorGroupVolumePoint[];
};

export function ErrorVolumeChart({ data }: ErrorVolumeChartProps) {
  const t = useTranslations('errors.detail.volumeChart');
  const chartData = useMemo(() => {
    const maxCount = Math.max(...data.map((d) => d.count), 1);
    return data.map((d) => ({
      ...d,
      displayCount: d.count === 0 ? maxCount * 0.04 : d.count, // Fallback to 4% to give zero-count bars a tiny visual presence
      isEmpty: d.count === 0,
    }));
  }, [data]);

  return (
    <div className='h-24'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <XAxis dataKey='date' hide />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={30}
            allowDecimals={false}
            tickCount={6}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.[0]) return null;
              const count = payload[0].payload.count as number;
              return (
                <div className='bg-popover border-border rounded-md border px-3 py-1.5 shadow-sm'>
                  <p className='text-popover-foreground text-sm'>{label}</p>
                  <p className='text-popover-foreground text-sm font-medium'>
                    {t('errorCount', { count })}
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey='displayCount' radius={[2, 2, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill='var(--destructive)' opacity={entry.isEmpty ? 0.15 : 0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
