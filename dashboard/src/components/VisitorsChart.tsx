"use client";
import { useQuery } from '@tanstack/react-query';
import { fetchUniqueVisitorsAction } from '@/app/actions';
import { DailyUniqueVisitorsRow } from "@/entities/visitors";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { useMemo } from 'react';
import { useFragmentedGranularityTimeSeriesLineChart } from '@/hooks/useFragmentedGranularityTimeSeriesLineChart';
import { timeFormat } from 'd3-time-format';
import { QueryFilter } from '@/entities/filter';
import { useDashboardId } from '@/hooks/use-dashboard-id';

interface VisitorsChartProps {
  startDate: Date;
  endDate: Date;
  granularity: GranularityRangeValues;
  queryFilters: QueryFilter[];
}

export default function VisitorsChart({ startDate, endDate, granularity, queryFilters }: VisitorsChartProps) {
  const dashboardId = useDashboardId();
  const { data = [], isLoading } = useQuery<DailyUniqueVisitorsRow[]>({
    queryKey: ['uniqueVisitors', dashboardId, startDate, endDate, granularity, queryFilters],
    queryFn: () => fetchUniqueVisitorsAction(dashboardId, startDate, endDate, granularity, queryFilters),
  });

  const timeSeriesProps = useMemo(() => {
    return {
      dataKey: 'unique_visitors',
      data,
      granularity
    } as const;
  }, [data, granularity]);

  const {
    chartData,
    tooltipLabelFormatter,
    scale,
    ticks
  } = useFragmentedGranularityTimeSeriesLineChart(timeSeriesProps);

  if (isLoading) return <div>Loading chart...</div>;
  if (data.length === 0) return <div>No data available.</div>;

  return (
    <div className="rounded-lg">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-foreground">Visitors</h2>
        <p className="text-sm text-muted-foreground">Unique visitors over time</p>
      </div>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="date"
              type='number'
              ticks={ticks}
              domain={["dataMin", "dataMax"]}
              scale={scale}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              tickFormatter={timeFormat("%b %d")}
              axisLine={false} tickLine={false}
            />
            <YAxis allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip
              labelFormatter={tooltipLabelFormatter}
              formatter={(value) => [value, "Unique visitors"]}
              contentStyle={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', borderColor: 'var(--border)' }}
            />
            <Line type="monotone" dataKey="unique_visitors" stroke="var(--chart-1)" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 