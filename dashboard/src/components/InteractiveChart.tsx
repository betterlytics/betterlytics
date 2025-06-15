import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ChartDataPoint {
  date: string | number;
  [key: string]: string | number;
}

interface InteractiveChartProps {
  title: string;
  data: ChartDataPoint[];
  valueField: string;
  color: string;
  formatValue?: (value: number) => string;
}

const InteractiveChart: React.FC<InteractiveChartProps> = React.memo(
  ({ title, data, valueField, color, formatValue }) => {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
        </CardHeader>

        <CardContent className='pb-0'>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${valueField}`} x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor={color} stopOpacity={0.3} />
                    <stop offset='95%' stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' className='opacity-10' />
                <XAxis
                  dataKey='formattedDate'
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  className='text-muted-foreground'
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatValue ? formatValue : (value: number) => value.toLocaleString()}
                  className='text-muted-foreground'
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0].value as number;
                      const formattedValue = formatValue ? formatValue(value) : value.toLocaleString();
                      return (
                        <div className='bg-popover border-border rounded-lg border p-3 shadow-lg'>
                          <p className='text-muted-foreground text-sm'>{label}</p>
                          <p className='text-foreground text-sm font-medium'>{formattedValue}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type='monotone'
                  dataKey={valueField}
                  stroke={color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#gradient-${valueField})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  },
);

InteractiveChart.displayName = 'InteractiveChart';

export default InteractiveChart;
