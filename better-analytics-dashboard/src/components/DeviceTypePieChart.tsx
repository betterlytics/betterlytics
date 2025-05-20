import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getDeviceLabel, getDeviceColor } from "@/constants/deviceTypes";

interface DeviceTypePieChartProps {
  breakdown: { device_type: string; visitors: number }[];
}

export default function DeviceTypePieChart({ breakdown }: DeviceTypePieChartProps) {
  const total = breakdown.reduce((sum, d) => sum + d.visitors, 0);
  const data = breakdown.map((d) => ({
    ...d,
    percent: total ? Math.round((d.visitors / total) * 100) : 0,
    color: getDeviceColor(d.device_type),
    label: getDeviceLabel(d.device_type),
  }));

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-1 w-full">Devices</h2>
      <p className="text-sm text-muted-foreground mb-4 w-full">Visitors by device type</p>
      <div className="w-full flex flex-col items-center">
        <ResponsiveContainer width={220} height={180}>
          <PieChart>
            <Pie
              data={data}
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
              {data.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-4">
          {data.map((entry) => (
            <div key={entry.device_type} className="flex items-center gap-1 text-sm">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="font-medium text-foreground">{entry.label}</span>
              <span className="text-muted-foreground">{entry.percent}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 