import React, { useMemo } from 'react';
import { ResponsiveContainer, Area, XAxis, YAxis, CartesianGrid, Tooltip, Line, ComposedChart } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartTooltip } from './charts/ChartTooltip';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { type ComparisonMapping } from '@/types/charts';
import { defaultDateLabelFormatter, granularityDateFormatter } from '@/utils/chartUtils';

interface ChartDataPoint {
  date: string | number;
  value: number[];
}

interface InteractiveChartProps {
  title: string;
  data: ChartDataPoint[];
  color: string;
  formatValue?: (value: number) => string;
  granularity?: GranularityRangeValues;
  comparisonMap?: ComparisonMapping[];
}

const InteractiveChart: React.FC<InteractiveChartProps> = React.memo(
  ({ title, data, color, formatValue, granularity, comparisonMap }) => {
    const axisFormatter = useMemo(() => granularityDateFormatter(granularity), [granularity]);
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
        </CardHeader>

        <CardContent className='pb-0'>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-value`} x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor={color} stopOpacity={0.3} />
                    <stop offset='95%' stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' className='opacity-10' />
                <XAxis
                  dataKey='date'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  className='text-muted-foreground'
                  tickFormatter={(value) =>
                    axisFormatter(new Date(typeof value === 'number' ? value : String(value)))
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
                      comparisonMap={comparisonMap}
                    />
                  }
                />
                <Area
                  type='monotone'
                  dataKey={'value.0'}
                  stroke={color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={'url(#gradient-value)'}
                />
                <Line
                  type='monotone'
                  dataKey={'value.1'}
                  stroke={'var(--chart-comparison)'}
                  strokeDasharray='4 4'
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  },
);

InteractiveChart.displayName = 'InteractiveChart';

export default InteractiveChart;
