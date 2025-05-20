'use client';

import { DeviceType } from "@/entities/devices";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getDeviceLabel, getDeviceColor } from "@/constants/deviceTypes";
import { useMemo } from "react";

interface DeviceTypeChartProps {
  data: DeviceType[];
  isLoading: boolean;
}

export default function DeviceTypeChart({ data, isLoading }: DeviceTypeChartProps) {
  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-accent border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const chartData = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.visitors, 0);
    return data.map(d => ({
      ...d,
      percent: total ? Math.round((d.visitors / total) * 100) : 0,
      color: getDeviceColor(d.device_type),
      label: getDeviceLabel(d.device_type),
    }));
  }, [data]);

  return (
    <div className="h-64 flex flex-col items-center">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="visitors"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            fill="#8884d8"
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
      <div className="flex justify-center gap-4 mt-4">
        {chartData.map((entry) => (
          <div key={entry.label} className="flex items-center gap-1 text-sm">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="font-medium text-foreground">{entry.label}</span>
            <span className="text-muted-foreground">{entry.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
} 