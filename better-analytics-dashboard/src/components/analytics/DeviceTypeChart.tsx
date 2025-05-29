'use client';

import { DeviceType } from '@/entities/devices';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getDeviceLabel, getDeviceColor } from '@/constants/deviceTypes';
import { useMemo } from 'react';

interface DeviceTypeChartProps {
  data: DeviceType[];
  isLoading: boolean;
}

export default function DeviceTypeChart({ data, isLoading }: DeviceTypeChartProps) {
  const chartData = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.visitors, 0);
    return data.map((d) => ({
      ...d,
      percent: total ? Math.round((d.visitors / total) * 100) : 0,
      color: getDeviceColor(d.device_type),
      label: getDeviceLabel(d.device_type),
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className='flex h-48 items-center justify-center'>
        <div className='flex flex-col items-center gap-3'>
          <div className='border-accent border-t-primary h-8 w-8 animate-spin rounded-full border-4'></div>
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-64 flex-col items-center'>
      <ResponsiveContainer width='100%' height={200}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey='visitors'
            nameKey='label'
            cx='50%'
            cy='50%'
            innerRadius={50}
            outerRadius={70}
            fill='#8884d8'
            paddingAngle={2}
            label={false}
          >
            {chartData.map((entry) => (
              <Cell key={`cell-${entry.label}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => value.toLocaleString()} />
        </PieChart>
      </ResponsiveContainer>
      <div className='mt-4 flex justify-center gap-4'>
        {chartData.map((entry) => (
          <div key={entry.label} className='flex items-center gap-1 text-sm'>
            <span className='inline-block h-3 w-3 rounded-full' style={{ backgroundColor: entry.color }}></span>
            <span className='text-foreground font-medium'>{entry.label}</span>
            <span className='text-muted-foreground'>{entry.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
