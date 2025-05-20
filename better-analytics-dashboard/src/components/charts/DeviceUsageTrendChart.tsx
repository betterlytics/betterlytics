'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { DeviceUsageTrendRow } from '@/entities/devices';
import { getDeviceColor } from '@/utils/deviceColors';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { capitalizeFirstLetter } from '@/utils/formatters';

interface DeviceUsageTrendChartProps {
  data?: DeviceUsageTrendRow[];
  loading?: boolean;
}

const calculateDeviceTypeTotals = (data: DeviceUsageTrendRow[]): Record<string, number> => {
  if (!data || data.length === 0) {
    return {};
  }
  return data.reduce((acc, item) => {
    acc[item.device_type] = (acc[item.device_type] || 0) + item.count;
    return acc;
  }, {} as Record<string, number>);
};

const getSortedDeviceTypes = (
  data: DeviceUsageTrendRow[],
  deviceTypeTotals: Record<string, number>
): string[] => {
  if (!data || data.length === 0) {
    return [];
  }
  return Array.from(new Set(data.map(item => item.device_type)))
    .sort((a, b) => (deviceTypeTotals[b] || 0) - (deviceTypeTotals[a] || 0));
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 shadow-lg rounded-md border border-gray-200">
        <p className="text-xs text-gray-500">{format(new Date(label), 'MMM dd, yyyy HH:mm')}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} className="text-sm text-gray-700" style={{ color: entry.color }}>
            {`${capitalizeFirstLetter(entry.name)}: ${entry.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const prepareChartData = (
  rawData: DeviceUsageTrendRow[],
  allDeviceTypes: string[]
): Array<Record<string, any>> => {
  if (!rawData || rawData.length === 0 || !allDeviceTypes || allDeviceTypes.length === 0) {
    return [];
  }

  const dataByDate: Record<string, Record<string, any>> = {};

  rawData.forEach(item => {
    const { date } = item;
    if (!dataByDate[date]) {
      dataByDate[date] = { date };
      allDeviceTypes.forEach(deviceType => {
        dataByDate[date][deviceType] = 0;
      });
    }
  });

  rawData.forEach(item => {
    const { date, device_type, count } = item;
    if (dataByDate[date]) {
      dataByDate[date][device_type] = count;
    }
  });

  return Object.values(dataByDate).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

export default function DeviceUsageTrendChart({ 
  data, 
  loading = false 
}: DeviceUsageTrendChartProps) {
  const deviceTypeTotals = useMemo(() => calculateDeviceTypeTotals(data || []), [data]);

  const sortedDeviceTypes = useMemo(
    () => getSortedDeviceTypes(data || [], deviceTypeTotals),
    [data, deviceTypeTotals]
  );

  const chartData = useMemo(() => {
    if (!data || data.length === 0 || sortedDeviceTypes.length === 0) {
      return [];
    }
    return prepareChartData(data, sortedDeviceTypes);
  }, [data, sortedDeviceTypes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Loading data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-center">
          <p className="text-gray-500 mb-1">No device trend data available</p>
          <p className="text-xs text-gray-400">Try adjusting the time range or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 12 }} 
            tickMargin={10}
            tickFormatter={(value) => format(new Date(value), 'MMM dd')}
          />
          <YAxis
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 12 }}
            tickMargin={10}
            tickFormatter={(val) => val.toLocaleString()}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend verticalAlign="bottom" height={36}/>
          
          {sortedDeviceTypes.map((deviceType) => (
            <Area
              key={deviceType}
              type="monotone"
              dataKey={deviceType}
              stackId="1"
              stroke={getDeviceColor(deviceType)}
              fill={getDeviceColor(deviceType)}
              fillOpacity={0.7}
              name={capitalizeFirstLetter(deviceType)}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
} 