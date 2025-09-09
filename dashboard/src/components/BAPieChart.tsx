import React from 'react';
import { useTranslations } from 'next-intl';
import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { ChartTooltip } from './charts/ChartTooltip';
import { capitalizeFirstLetter, formatPercentage } from '@/utils/formatters';

interface ChartDataPoint {
  name: string;
  value: number[];
  percentage: number;
}

interface BAPieChartProps {
  data: ChartDataPoint[];
  getLabel: (name: string) => string;
  getColor: (name: string) => string;
  getIcon?: (name: string) => React.ReactNode;
  formatValue?: (value: number) => string;
}

const BAPieChart: React.FC<BAPieChartProps> = React.memo(({ data, getColor, getIcon, formatValue, getLabel }) => {
  const t = useTranslations('dashboard.emptyStates');
  if (data.length === 0) {
    return (
      <div className='flex h-[300px] items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground mb-1'>{t('noData')}</p>
          <p className='text-muted-foreground/70 text-xs'>{t('adjustTimeRange')}</p>
        </div>
      </div>
    );
  }

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
        {data.slice(0, 4).map((entry) => (
          <div key={entry.name} className='flex items-center gap-1 text-sm'>
            <span
              className='inline-block h-3 w-3 rounded-full'
              style={{ backgroundColor: getColor(entry.name) }}
            ></span>
            {getIcon && getIcon(entry.name)}
            <span className='text-foreground font-medium'>
              {getLabel?.(entry.name) ?? capitalizeFirstLetter(entry.name)}
            </span>
            <span className='text-muted-foreground'>{formatPercentage(entry.percentage)}</span>
          </div>
        ))}
        {data.length > 4 && '...'}
      </div>
    </div>
  );
});

BAPieChart.displayName = 'BAPieChart';

export default BAPieChart;
