'use client';

import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

type ResponsiveSparklineProps = {
  values: number[];
  height?: number;
  className?: string;
};

export default function ResponsiveSparkline({ values, height = 20, className }: ResponsiveSparklineProps) {
  const data = useMemo(() => values.map((value, index) => ({ index, value })), [values]);

  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Line type='monotone' dataKey='value' stroke='var(--chart-1)' strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
