'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getTrendInfo, formatDifference, defaultDateLabelFormatter } from '@/utils/chartUtils';
import { type ComparisonMapping } from '@/types/charts';
import { type GranularityRangeValues } from '@/utils/granularityRanges';

interface PayloadEntry {
  value: number;
  dataKey: string;
  name?: string;
  color?: string;
}

interface StackedAreaChartTooltipProps {
  active?: boolean;
  payload?: any;
  label?: string | number;
  formatter?: (value: number) => string;
  labelFormatter?: (date: string | number, granularity?: GranularityRangeValues) => string;
  comparisonMap?: ComparisonMapping[];
  granularity?: GranularityRangeValues;
}

export function StackedAreaChartTooltip({
  active,
  payload,
  label,
  formatter = (value) => value.toLocaleString(),
  labelFormatter = defaultDateLabelFormatter,
  comparisonMap,
  granularity,
}: StackedAreaChartTooltipProps) {
  if (!active || !payload || !payload.length || !label) {
    return null;
  }

  const hasComparison = !!comparisonMap;

  const comparisonData = hasComparison
    ? comparisonMap.find((mapping) => mapping.currentDate === Number(label))
    : null;

  const getCurrentValue = (entry: PayloadEntry): number => {
    return entry.value || 0;
  };

  const getCompareValue = (entry: PayloadEntry): number => {
    return comparisonData ? comparisonData.compareValues[entry.dataKey] || 0 : 0;
  };

  const currentTotal = payload.reduce((sum: number, entry: PayloadEntry) => sum + getCurrentValue(entry), 0);
  const compareTotal = comparisonData
    ? payload.reduce((sum: number, entry: PayloadEntry) => sum + getCompareValue(entry), 0)
    : 0;

  const sortedPayload = [...payload].sort((a, b) => getCurrentValue(b) - getCurrentValue(a));

  const totalTrend = getTrendInfo(currentTotal, compareTotal, hasComparison);
  const totalDifference = formatDifference(currentTotal, compareTotal, hasComparison, formatter);

  return (
    <div className='animate-in zoom-in-95 border-border bg-popover/95 min-w-[220px] rounded-lg border p-4 shadow-xl backdrop-blur-sm'>
      <div className='border-border mb-3 border-b pb-2'>
        <div className='space-y-1'>
          <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
            {labelFormatter(label, granularity)}
          </span>
          {hasComparison && comparisonData && (
            <div className='text-muted-foreground text-xs'>
              vs {labelFormatter(comparisonData.compareDate, granularity)}
            </div>
          )}
        </div>
      </div>

      <div className='mb-3'>
        <div className='flex items-start justify-between'>
          <div>
            <div className='text-muted-foreground mb-1 text-xs'>Current Total</div>
            <div className='text-popover-foreground text-lg font-semibold'>{formatter(currentTotal)}</div>
          </div>

          {hasComparison && (
            <div className='text-right'>
              <div className='text-muted-foreground mb-1 text-xs'>Previous Total</div>
              <div className='text-popover-foreground/80 text-sm'>{formatter(compareTotal)}</div>
            </div>
          )}
        </div>

        {hasComparison && totalDifference && (
          <div className='mt-2'>
            <div
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium',
                totalTrend.bgColor,
              )}
            >
              <totalTrend.icon className={cn('h-3 w-3', totalTrend.color)} fill='currentColor' />
              <span className={totalTrend.color}>{totalDifference}</span>
            </div>
          </div>
        )}
      </div>

      <div className='space-y-2'>
        <div className='text-muted-foreground text-xs'>Breakdown</div>
        <div className='space-y-2'>
          {sortedPayload.map((entry, index) => {
            const currentValue = getCurrentValue(entry);
            const compareValue = getCompareValue(entry);
            const trend = getTrendInfo(currentValue, compareValue, hasComparison);
            const difference = formatDifference(currentValue, compareValue, hasComparison, formatter);

            return (
              <div key={entry.dataKey || index} className='space-y-1'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='h-2 w-2 rounded-full' style={{ backgroundColor: entry.color }} />
                    <span className='text-popover-foreground/80 text-sm'>{entry.name || entry.dataKey}</span>
                  </div>
                  <span className='text-popover-foreground text-sm font-medium'>{formatter(currentValue)}</span>
                </div>

                {hasComparison && (
                  <div className='ml-4 flex items-center justify-between text-xs'>
                    <span className='text-muted-foreground'>vs {formatter(compareValue)}</span>
                    {difference && (
                      <div
                        className={cn(
                          'ml-1 flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium',
                          trend.bgColor,
                        )}
                      >
                        <trend.icon className={cn('h-3.5 w-3.5', trend.color)} fill='currentColor' />
                        <span className={trend.color}>{difference}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
