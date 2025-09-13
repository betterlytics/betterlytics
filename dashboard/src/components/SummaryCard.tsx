'use client';

import React, { useId, useMemo } from 'react';
import { ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, MousePointerClick } from 'lucide-react';

interface ChartData {
  date: string;
  [key: string]: string | number;
}

interface SummaryCardProps<T extends ChartData = ChartData> {
  title: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  footer?: React.ReactNode;

  // Compare
  comparePercentage?: number | null;

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

function calculateTrend(comparePercentage?: number | null): TrendData | null {
  if (comparePercentage === null || comparePercentage === undefined) {
    return null;
  }

  const absPercentage = Math.abs(comparePercentage);

  let direction: 'up' | 'down' | 'neutral' = 'neutral';
  if (absPercentage > 0) {
    direction = comparePercentage > 0 ? 'up' : 'down';
  }

  return {
    direction,
    percentage: absPercentage,
    isPositive: comparePercentage > 0,
  };
}

const SummaryCard = React.memo(
  <T extends ChartData = ChartData>({
    title,
    value,
    icon,
    footer,
    rawChartData,
    comparePercentage,
    valueField,
    chartColor = 'var(--chart-1)',
    isActive = false,
    onClick,
  }: SummaryCardProps<T>) => {
    const gradientId = useId();
    const trendData = useMemo(() => calculateTrend(comparePercentage), [comparePercentage]);

    return (
      <Card
        className={`group relative overflow-hidden rounded-xl py-0 transition-all duration-200 ${
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
            className={`pointer-events-none absolute right-0 bottom-0 left-0 h-16 transition-opacity duration-200`}
          >
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart data={rawChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`summary-gradient-${gradientId}`} x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset='95%' stopColor={chartColor} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area
                  type='linear'
                  dataKey={valueField as string}
                  stroke={chartColor}
                  strokeWidth={1}
                  fill={`url(#summary-gradient-${gradientId})`}
                  dot={false}
                  activeDot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <CardContent className='relative z-10 flex h-full flex-col space-y-0 px-2 py-2 pb-4 sm:px-3'>
          <div className='mb-1 flex items-center justify-between'>
            <span className='text-foreground text-sm font-medium hyphens-auto lg:text-base'>{title}</span>
            {onClick && (
              <div className='opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
                <MousePointerClick className='text-foreground/60 h-4 w-4' />
              </div>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {icon && <div className='text-foreground pt-1'>{icon}</div>}
            <span className='text-foreground text-base font-bold tracking-tight sm:text-lg lg:text-2xl'>
              {value}
            </span>
            {trendData && trendData.direction !== 'neutral' && (
              <Badge
                variant='outline'
                className={`text-foreground gap-1 text-xs ${
                  trendData.isPositive ? 'text-trend-up border-none' : 'text-trend-down border-none'
                }`}
              >
                {trendData.direction === 'up' ? (
                  <ChevronUp className='h-3 w-3' fill='currentColor' />
                ) : (
                  <ChevronDown className='h-3 w-3' fill='currentColor' />
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
