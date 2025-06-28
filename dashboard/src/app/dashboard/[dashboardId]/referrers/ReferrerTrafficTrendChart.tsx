'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { ReferrerTrafficBySourceRow } from '@/entities/referrers';
import { getReferrerColor } from '@/utils/referrerColors';
import { useMemo } from 'react';
import { format } from 'date-fns';
import ReferrerLegend from './ReferrerLegend';
import { sortByDate } from '@/utils/dateHelpers';

interface ReferrerTrafficTrendChartProps {
  data?: ReferrerTrafficBySourceRow[];
}

// Helper function to calculate total counts for each referrer source
const calculateSourceTotals = (data: ReferrerTrafficBySourceRow[]): Record<string, number> => {
  if (!data || data.length === 0) {
    return {};
  }
  return data.reduce(
    (acc, item) => {
      acc[item.referrer_source] = (acc[item.referrer_source] || 0) + item.count;
      return acc;
    },
    {} as Record<string, number>,
  );
};

// Helper function to get unique referrer sources sorted by their total counts (descending)
const getSortedReferrerSources = (
  data: ReferrerTrafficBySourceRow[],
  sourceTotals: Record<string, number>,
): string[] => {
  if (!data || data.length === 0) {
    return [];
  }
  return Array.from(new Set(data.map((item) => item.referrer_source))).sort(
    (a, b) => (sourceTotals[b] || 0) - (sourceTotals[a] || 0),
  );
};

// Custom tooltip for better display
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className='bg-card border-border rounded-md border p-2 shadow-lg'>
        <p className='text-muted-foreground text-xs'>{format(new Date(label), 'MMM dd, yyyy HH:mm')}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`tooltip-${index}`} className='text-sm' style={{ color: entry.color }}>
            {`${entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}: ${entry.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Prepares raw data for the stacked area chart
const prepareChartData = (
  rawData: ReferrerTrafficBySourceRow[],
  allSources: string[],
): Array<Record<string, any>> => {
  if (!rawData || rawData.length === 0 || !allSources || allSources.length === 0) {
    return [];
  }

  const dataByDate: Record<string, Record<string, any>> = {};

  rawData.forEach((item) => {
    const { date } = item;
    if (!dataByDate[date]) {
      dataByDate[date] = { date };
      allSources.forEach((source) => {
        dataByDate[date][source] = 0;
      });
    }
  });

  rawData.forEach((item) => {
    const { date, referrer_source, count } = item;
    if (dataByDate[date]) {
      dataByDate[date][referrer_source] = count;
    }
  });

  return sortByDate(Object.values(dataByDate) as Array<{ date: string } & Record<string, number>>);
};

export default function ReferrerTrafficTrendChart({ data }: ReferrerTrafficTrendChartProps) {
  const sourceTotals = useMemo(() => calculateSourceTotals(data!), [data]);

  const referrerSources = useMemo(() => getSortedReferrerSources(data!, sourceTotals), [data, sourceTotals]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0 || referrerSources.length === 0) {
      return [];
    }
    return prepareChartData(data, referrerSources);
  }, [data, referrerSources]);

  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div className='flex h-[300px] items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground mb-1'>No trend data available</p>
          <p className='text-muted-foreground/70 text-xs'>Try adjusting the time range or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-[300px] w-full'>
      <ResponsiveContainer width='100%' height='100%'>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='var(--color-border)' />
          <XAxis
            dataKey='date'
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
            tickFormatter={(value) => value.toLocaleString()}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend content={<ReferrerLegend showPercentage={false} />} verticalAlign='bottom' />

          {referrerSources.map((source) => (
            <Area
              key={source}
              type='monotone'
              dataKey={source}
              stackId='1'
              stroke={getReferrerColor(source)}
              fill={getReferrerColor(source)}
              fillOpacity={0.6}
              name={source}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
