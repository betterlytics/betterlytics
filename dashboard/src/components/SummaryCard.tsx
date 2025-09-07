'use client';

import React, { useMemo } from 'react';
import { ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, MousePointer2 } from 'lucide-react';

interface ChartData {
  date: string;
  [key: string]: string | number;
}

interface SummaryCardProps<T extends ChartData = ChartData> {
  title: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;

  // Mini chart data
  rawChartData?: T[];
  valueField?: keyof T;
  chartColor?: string;

  // Interactive props
  isActive?: boolean;
  onClick?: () => void;
}

interface TrendData {
  direction: 'up' | 'down' | 'neutral';
  percentage: number;
  isPositive: boolean;
}

function calculateTrend<T extends ChartData>(data: T[], valueField: keyof T): TrendData | null {
  if (data.length < 2) return null;

  const firstValue = Number(data[0][valueField]);
  const lastValue = Number(data[data.length - 1][valueField]);

  if (firstValue === 0) return null;

  const percentageChange = ((lastValue - firstValue) / firstValue) * 100;
  const absPercentage = Math.abs(percentageChange);

  let direction: 'up' | 'down' | 'neutral' = 'neutral';
  if (absPercentage > 0) {
    direction = percentageChange > 0 ? 'up' : 'down';
  }

  return {
    direction,
    percentage: absPercentage,
    isPositive: percentageChange > 0,
  };
}

const SummaryCard = React.memo(
  <T extends ChartData = ChartData>({
    title,
    value,
    icon,
    footer,
    rawChartData,
    valueField,
    chartColor = 'var(--chart-1)',
    isActive = false,
    onClick,
  }: SummaryCardProps<T>) => {
    const trendData = useMemo(
      () => (rawChartData && valueField ? calculateTrend(rawChartData, valueField) : null),
      [rawChartData, valueField],
    );

    return (
      <Card
        className={`group relative h-full overflow-hidden py-4 transition-all duration-200 ${
          onClick
            ? 'hover:border-primary/40 hover:bg-accent/20 cursor-pointer hover:scale-[1.02] hover:shadow-lg'
            : ''
        } ${
          isActive
            ? 'border-primary ring-primary/30 bg-primary/5 shadow-lg ring-2'
            : onClick
              ? 'hover:border-primary/20'
              : ''
        }`}
        onClick={onClick}
      >
        {rawChartData && rawChartData.length > 0 && valueField && (
          <div
            className={`pointer-events-none absolute right-0 bottom-0 left-0 h-16 opacity-[0.2] transition-opacity duration-200 ${onClick ? 'group-hover:opacity-[0.15]' : ''}`}
          >
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={rawChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-${title}`} x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor={chartColor} stopOpacity={0.6} />
                    <stop offset='100%' stopColor={chartColor} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <Area
                  type='monotone'
                  dataKey={valueField as string}
                  stroke={chartColor}
                  strokeWidth={2}
                  fill={`url(#gradient-${title})`}
                  dot={false}
                  activeDot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <CardContent className='relative z-10 flex h-full flex-col space-y-0 px-4 py-2'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-muted-foreground text-sm font-medium'>{title}</span>
            {onClick && (
              <div className='opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
                <MousePointer2 className='text-muted-foreground/60 h-4 w-4' />
              </div>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {icon && <div className='text-muted-foreground pt-1'>{icon}</div>}
            <span className='text-foreground text-2xl font-bold tracking-tight'>{value}</span>
            {trendData && trendData.direction !== 'neutral' && (
              <Badge
                variant='outline'
                className={`gap-1 text-xs ${
                  trendData.isPositive ? 'border-none text-green-600' : 'border-none text-red-600'
                }`}
              >
                {trendData.direction === 'up' ? (
                  <ChevronUp className='h-3 w-3' />
                ) : (
                  <ChevronDown className='h-3 w-3' />
                )}
                <span>{trendData.percentage.toFixed(1)}%</span>
              </Badge>
            )}
          </div>
          {footer && <div className='mt-auto pt-3'>{footer}</div>}
        </CardContent>
      </Card>
    );
  },
);

SummaryCard.displayName = 'SummaryCard';

export default SummaryCard;
