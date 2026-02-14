import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import PieChartTooltip from './charts/PieChartTooltip';
import { capitalizeFirstLetter, formatPercentage } from '@/utils/formatters';
import DataEmptyComponent from './DataEmptyComponent';

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
  onSliceClick?: (name: string) => void;
}

const BAPieChart: React.FC<BAPieChartProps> = React.memo(
  ({ data, getColor, getIcon, formatValue, getLabel, onSliceClick }) => {
    const t = useTranslations('dashboard.emptyStates');
    const tFilters = useTranslations('components.filters');
    const locale = useLocale();
    if (data.length === 0) {
      return (
        <DataEmptyComponent />
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
                <Cell
                  key={`cell-${entry.name}`}
                  fill={getColor(entry.name)}
                  onClick={onSliceClick ? () => onSliceClick(entry.name) : undefined}
                  style={{ cursor: onSliceClick ? 'pointer' : undefined }}
                />
              ))}
            </Pie>
            <Tooltip
              content={
                <PieChartTooltip
                  valueFormatter={formatValue}
                  labelFormatter={capitalizeFirstLetter}
                  renderIcon={getIcon}
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className='mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2'>
          {data.slice(0, 4).map((entry) => {
            const label = getLabel?.(entry.name) ?? capitalizeFirstLetter(entry.name);
            return (
              <div
                key={entry.name}
                className='flex items-center gap-1 text-sm'
                role={onSliceClick ? 'button' : undefined}
                tabIndex={onSliceClick ? 0 : undefined}
                onClick={onSliceClick ? () => onSliceClick(entry.name) : undefined}
                onKeyDown={
                  onSliceClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') onSliceClick(entry.name);
                      }
                    : undefined
                }
                title={onSliceClick ? tFilters('filterBy', { label }) : undefined}
                style={{ cursor: onSliceClick ? 'pointer' : undefined }}
              >
                <span
                  className='inline-block h-3 w-3 rounded-full'
                  style={{ backgroundColor: getColor(entry.name) }}
                ></span>
                {getIcon && getIcon(entry.name)}
                <span className='text-foreground font-medium'>{label}</span>
                <span className='text-muted-foreground'>{formatPercentage(entry.percentage, locale)}</span>
              </div>
            );
          })}
          {data.length > 4 && '...'}
        </div>
      </div>
    );
  },
);

BAPieChart.displayName = 'BAPieChart';

export default BAPieChart;
