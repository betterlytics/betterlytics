import React, { useMemo } from 'react';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Line, ComposedChart } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartTooltip } from './charts/ChartTooltip';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { defaultDateLabelFormatter, granularityDateFormmatter } from '@/utils/chartUtils';

interface ChartDataPoint {
  date: string | number;
  value: number[];
}

export interface MultiSeriesConfig {
  dataKey: string; // e.g. 'value.0'
  stroke: string;
  strokeWidth?: number;
  dot?: boolean;
}

interface MultiSeriesChartProps {
  title: string;
  data: ChartDataPoint[];
  granularity?: GranularityRangeValues;
  formatValue?: (value: number) => string;
  series: MultiSeriesConfig[];
}

const MultiSeriesChart: React.FC<MultiSeriesChartProps> = React.memo(
  ({ title, data, granularity, formatValue, series }) => {
    const axisFormatter = useMemo(() => granularityDateFormmatter(granularity), [granularity]);
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
        </CardHeader>

        <CardContent className='pb-0'>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 3' className='opacity-10' />
                <XAxis
                  dataKey='date'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  className='text-muted-foreground'
                  tickFormatter={(value) =>
                    axisFormatter(new Date(typeof value === 'number' ? value : Date.parse(String(value))))
                  }
                  minTickGap={100}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatValue ? formatValue : (value: number) => value.toLocaleString()}
                  className='text-muted-foreground'
                />

                <Tooltip
                  content={
                    <ChartTooltip
                      labelFormatter={(date) => defaultDateLabelFormatter(date, granularity)}
                      formatter={formatValue}
                    />
                  }
                />
                {series.map((s, idx) => (
                  <Line
                    key={`${s.dataKey}-${idx}`}
                    type='monotone'
                    dataKey={s.dataKey}
                    stroke={s.stroke}
                    strokeWidth={s.strokeWidth ?? 2}
                    dot={s.dot ?? false}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  },
);

MultiSeriesChart.displayName = 'MultiSeriesChart';

export default MultiSeriesChart;
