import React from 'react';
import {
  ResponsiveContainer,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { timeFormat } from 'd3-time-format';
import { ChartTooltip } from './charts/ChartTooltip';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { capitalizeFirstLetter, formatPercentage } from '@/utils/formatters';

interface ChartDataPoint {
  name: string;
  value: number[];
  percentage: number;
}

interface InteractivePieChartProps {
  data: ChartDataPoint[];
  getLabel: (name: string) => string;
  getColor: (name: string) => string;
  getIcon?: (name: string) => React.ReactNode;
  formatValue?: (value: number) => string;
}

const InteractivePieChart: React.FC<InteractivePieChartProps> = React.memo(
  ({ data, getColor, getIcon, formatValue }) => {
    return (
      <div className='flex h-64 flex-col items-center'>
        <ResponsiveContainer width='100%' height={200}>
          <PieChart>
            <Pie
              data={data}
              dataKey='value.0'
              nameKey='name'
              cx='50%'
              cy='50%'
              innerRadius={50}
              outerRadius={70}
              fill='#8884d8'
              paddingAngle={2}
              label={false}
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={getColor(entry.name)} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip labelFormatter={capitalizeFirstLetter} />} formatter={formatValue} />
          </PieChart>
        </ResponsiveContainer>
        <div className='mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2'>
          {data.map((entry) => (
            <div key={entry.name} className='flex items-center gap-1 text-sm'>
              <span
                className='inline-block h-3 w-3 rounded-full'
                style={{ backgroundColor: getColor(entry.name) }}
              ></span>
              {getIcon && getIcon(entry.name)}
              <span className='text-foreground font-medium'>{capitalizeFirstLetter(entry.name)}</span>
              <span className='text-muted-foreground'>{formatPercentage(entry.percentage)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

InteractivePieChart.displayName = 'InteractivePieChart';

export default InteractivePieChart;
