'use client';

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getCampaignSourceColor } from '@/utils/campaignColors';
import { formatPercentage } from '@/utils/formatters';

export const CampaignDataKey = {
  SOURCE: 'source',
  MEDIUM: 'medium',
  TERM: 'term',
  CONTENT: 'content',
} as const;

type CampaignDataKeyValue = typeof CampaignDataKey[keyof typeof CampaignDataKey];

interface CampaignBreakdownItem {
  visitors: number;
  [key: string]: unknown; // source, medium, term, content
}

interface CampaignPieChartProps {
  data: CampaignBreakdownItem[];
  isLoading: boolean;
  dataKey: CampaignDataKeyValue;
  title: string;
  subtitle: string;
  emptyStateMessage: string;
}

export default function CampaignPieChart({
  data,
  isLoading,
  dataKey,
  title,
  subtitle,
  emptyStateMessage,
}: CampaignPieChartProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg shadow border border-border p-6 min-h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">Loading chart data...</p>
      </div>
    );
  }

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const totalVisitors = data.reduce((sum, item) => sum + item.visitors, 0);
    return data.map((item) => ({
      name: item[dataKey],
      value: item.visitors,
      color: getCampaignSourceColor(item[dataKey] as string),
      percent: totalVisitors > 0 ? Math.round((item.visitors / totalVisitors) * 100) : 0,
    }));
  }, [data, dataKey]);

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow border border-border p-6 min-h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">{emptyStateMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow border border-border p-6">
      <h2 className="text-lg font-bold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      <div className="h-72 md:h-80 flex flex-col items-center mt-4">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name as string} fill={entry.color as string} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string, props: any) => [`${value.toLocaleString()} visitors (${props.payload.percent}%)`, name]} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-sm">
          {chartData.map((entry) => (
            <div key={entry.name as string} className="flex items-center">
              <span
                className="inline-block w-3 h-3 rounded-full mr-1.5"
                style={{ backgroundColor: entry.color as string }}
              ></span>
              <span className="text-muted-foreground">{entry.name as string} ({formatPercentage(entry.percent)})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 