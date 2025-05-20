'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ReferrerSourceAggregation } from '@/entities/referrers';
import { getReferrerColor } from '@/utils/referrerColors';
import { useMemo } from 'react';
import ReferrerLegend from './ReferrerLegend';

interface ReferrerDistributionChartProps {
  data?: ReferrerSourceAggregation[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card p-2 shadow-lg rounded-md border border-border">
        <p className="text-sm text-foreground">{`${payload[0].name}: ${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

// Computes the percentage distribution of the referrer sources
const getPercentageDistribution = (data: ReferrerSourceAggregation[]) => {
  const total = data.reduce((sum, item) => sum + (item.visitorCount || 0), 0);
  return data.map(item => ({
    name: item.referrer_source,
    value: total > 0 ? Number(((item.visitorCount || 0) / total * 100).toFixed(1)) : 0
  }));
}

export default function ReferrerDistributionChart({ data, loading = false }: ReferrerDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }
    return getPercentageDistribution(data);
  }, [data]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }
  
  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-1">No data available</p>
          <p className="text-sm text-muted-foreground/70">Try selecting a different time range</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-[300px] flex flex-col items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={getReferrerColor(entry.name)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            content={<ReferrerLegend showPercentage={true} />} 
            verticalAlign="bottom" 
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 