import React from 'react';
import { ResponsiveContainer, Area, XAxis, YAxis, CartesianGrid, Tooltip, Line, ComposedChart } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { timeFormat } from 'd3-time-format';
import { ChartTooltip } from './charts/ChartTooltip';
import { GranularityRangeValues } from '@/utils/granularityRanges';

interface ChartDataPoint {
  date: string | number;
  value: number[];
}

interface InteractiveStackedChartProps {
  data: {
    data: ChartDataPoint[];
    sortedKeys: string[];
    totals: Record<string, number>;
  };
  getColor: (kind: string) => string;
  formatLabel: (kind: string) => string;
  formatValue?: (value: number) => string;
  granularity?: GranularityRangeValues;
}

const InteractiveStackedChart: React.FC<InteractiveStackedChartProps> = React.memo(
  ({ data, getColor, formatLabel, formatValue, granularity }) => {
    const timeFormatter =
      granularity === undefined || granularity === 'day' ? timeFormat('%b %d') : timeFormat('%b %d - %H:%M');

    console.log(data);

    if (!data || data.data.length === 0) {
      return (
        <div className='flex h-[300px] items-center justify-center'>
          <div className='text-center'>
            <p className='text-foreground mb-1'>No data available</p>
            <p className='text-muted-foreground text-xs'>Try adjusting the time range or filters</p>
          </div>
        </div>
      );
    }

    return (
      <div className='h-80'>
        <ResponsiveContainer width='100%' height='100%'>
          <ComposedChart data={data.data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' vertical={false} stroke='#f1f5f9' />
            <XAxis
              dataKey='date'
              fontSize={12}
              tickLine={false}
              axisLine={false}
              className='text-muted-foreground'
              tickFormatter={timeFormat('%b %d')}
              minTickGap={100}
            />
            <YAxis
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue ? formatValue : (value: number) => value.toLocaleString()}
              className='text-muted-foreground'
            />

            <Tooltip content={<ChartTooltip labelFormatter={timeFormatter} formatter={formatValue} />} />
            {data.sortedKeys.map((key, index) => (
              <Area
                key={key}
                type='monotone'
                dataKey={`value.${index}`}
                stackId='1'
                stroke={getColor(key)}
                fill={getColor(key)}
                fillOpacity={0.7}
                name={formatLabel(key)}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  },
);

InteractiveStackedChart.displayName = 'InteractiveChart';

export default InteractiveStackedChart;
