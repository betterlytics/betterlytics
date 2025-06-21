'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ChartTooltipProps {
  payload?: {
    value: number;
    payload: { date: string | number; name?: string; label?: string; color?: string; value: number[] };
  }[];
  formatter?: (value: any) => string;
  labelFormatter: (date: any) => string;
  active?: boolean;
  label?: Date;
  className?: string;
}

export function ChartTooltip({ active, payload, label, formatter, labelFormatter, className }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }
  const name = label || payload[0].payload.name || payload[0].payload.label;

  const labelColor = payload[0].payload.color;

  const value = payload[0].value;
  const previousValue = (payload[1]?.value || payload[0].payload.value[1]) as number;
  const difference = value - previousValue;

  const formattedLabel = name ? labelFormatter(name) : name;

  const getTrendInfo = () => {
    if (previousValue === undefined || difference === 0) {
      return { icon: Minus, color: 'text-muted', bgColor: 'text-background/10' };
    }
    if (difference > 0) {
      return { icon: TrendingUp, color: 'text-green-400', bgColor: 'bg-green-500/10' };
    }
    return { icon: TrendingDown, color: 'text-red-400', bgColor: 'bg-red-500/10' };
  };

  const { icon: TrendIcon, color: trendColor, bgColor: trendBgColor } = getTrendInfo();

  // Format difference for display
  const formatDifference = (diff: number, prev: number | undefined) => {
    if (prev === undefined || diff === 0) return null;
    const sign = diff > 0 ? '+' : '';
    if (prev !== 0) {
      const percentage = ((diff / prev) * 100).toFixed(1);
      return `${sign}${formatter ? formatter(diff) : diff} (${sign}${percentage}%)`;
    }
    return `${sign}${formatter ? formatter(diff) : diff}`;
  };

  const formattedDifference = formatDifference(difference, previousValue);
  return (
    <div
      className={cn(
        'min-w-[200px] rounded-lg border border-gray-700/50 bg-gray-900/95 p-4 shadow-xl backdrop-blur-sm',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className,
      )}
    >
      <div className='mb-3 flex items-center gap-2 border-b border-gray-700/50 pb-2'>
        <div className='h-2 w-2 rounded-full bg-blue-500' style={{ background: labelColor }}></div>
        <span className='text-xs font-medium tracking-wide text-gray-300 uppercase'>{formattedLabel}</span>
      </div>

      <div className='mb-3'>
        <div className='mb-1 text-xs text-gray-400'>Current Period</div>
        <div className='text-lg font-semibold text-white'>{formatter ? formatter(value) : value}</div>
      </div>

      {previousValue !== undefined && (
        <div className='space-y-2'>
          <div className='text-xs text-gray-400'>Previous Period</div>
          <div className='flex items-center justify-between'>
            <span className='text-sm text-gray-300'>{formatter ? formatter(previousValue) : previousValue}</span>
          </div>

          {formattedDifference && (
            <div className={cn('flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium', trendBgColor)}>
              <TrendIcon className={cn('h-3 w-3', trendColor)} />
              <span className={trendColor}>{formattedDifference}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
