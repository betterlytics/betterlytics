"use client";
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchTotalPageViewsAction } from '@/app/actions/overview';
import { TotalPageViewsRow } from "@/entities/pageviews";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { timeFormat } from "d3-time-format";
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { useFragmentedGranularityTimeSeriesLineChart } from '@/hooks/useFragmentedGranularityTimeSeriesLineChart';

interface PageviewsChartProps {
  siteId: string;
  startDate: Date;
  endDate: Date;
  granularity: GranularityRangeValues;
}

export default function PageviewsChart({ siteId, startDate, endDate, granularity }: PageviewsChartProps) {
  const { data = [], isLoading } = useQuery<TotalPageViewsRow[]>({
    queryKey: ['pageViews', siteId, startDate, endDate, granularity],
    queryFn: () => fetchTotalPageViewsAction(siteId, startDate, endDate, granularity),
  });

  const timeSeriesProps = useMemo(() => {
    return {
      dataKey: 'views',
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
    <div>
      <div className="mb-2">
        <h2 className="text-lg font-bold text-foreground">Pageviews</h2>
        <p className="text-sm text-muted-foreground">Total pageviews over time</p>
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
              tickFormatter={timeFormat("%b %d")}
              tick={{ textAnchor: "middle", fill: 'var(--muted-foreground)', fontSize: 12 }}
              axisLine={false} tickLine={false}
            />
            <YAxis allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip
              labelFormatter={tooltipLabelFormatter}
              formatter={(value) => [value, "Total views"]}
              contentStyle={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', borderColor: 'var(--border)' }}
            />
            <Line type="monotone" dataKey="views" stroke="var(--chart-2)" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 