'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getTrendInfo, formatDifference, defaultDateLabelFormatter } from '@/utils/chartUtils';
import { type ComparisonMapping } from '@/types/charts';
import { type GranularityRangeValues } from '@/utils/granularityRanges';
import { Separator } from '@/components/ui/separator';
import { usePartialBucketRange } from '@/hooks/use-partial-bucket-range';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('charts.tooltip');
  const comparisonData = comparisonMap?.find((mapping) => mapping.currentDate === Number(label)) ?? null;

  const { partialRange, comparePartialRange } = usePartialBucketRange(label, comparisonData?.compareDate);

  if (!active || !payload || !payload.length || !label) {
    return null;
  }

  const hasComparison = !!comparisonMap;

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
  const totalDifference = formatDifference(currentTotal, compareTotal, hasComparison, formatter, false);

  return (
    <div className='border-border bg-popover/95 min-w-[220px] rounded-lg border p-3 shadow-xl backdrop-blur-sm'>
      <div className='mb-2'>
        <div className='text-muted-foreground text-sm font-medium tracking-wide'>
          {labelFormatter(label, granularity)}
        </div>
        {partialRange && (
          <div className='text-muted-foreground/60 mt-0.5 text-xs'>
            (<span className='italic'>{t('partial')}: </span>
            {partialRange})
          </div>
        )}
        {hasComparison && comparisonData && (
          <div className='text-muted-foreground/60 mt-0.5'>
            <div className='text-sm'>{labelFormatter(comparisonData.compareDate, granularity)}</div>
            {comparePartialRange && (
              <div className='text-xs'>
                (<span className='italic'>{t('partial')}: </span>
                {comparePartialRange})
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      <div className='mt-2 space-y-2'>
        {sortedPayload.map((entry, index) => {
          const currentValue = getCurrentValue(entry);
          const compareValue = getCompareValue(entry);
          const trend = getTrendInfo(currentValue, compareValue, hasComparison);
          const difference = formatDifference(currentValue, compareValue, hasComparison, formatter, false);

          return (
            <div key={entry.dataKey || index} className='space-y-1'>
              <div className='flex items-center justify-between gap-3'>
                <div className='flex items-center gap-2'>
                  <div className='h-2 w-2 rounded-full' style={{ backgroundColor: entry.color }} />
                  <span className='text-popover-foreground text-sm'>{entry.name || entry.dataKey}</span>
                </div>
                <div className='flex items-center gap-2'>
                  {hasComparison && (
                    <>
                      {difference && (
                        <div className='flex items-center gap-1 text-sm font-medium'>
                          <trend.icon className={cn('h-3 w-3', trend.color)} fill='currentColor' />
                          <span className={trend.color}>{difference}</span>
                        </div>
                      )}
                    </>
                  )}
                  <span className='text-popover-foreground text-sm font-medium'>{formatter(currentValue)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className='mt-3'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <div className='w-2 shrink-0' />
            <span className='text-popover-foreground text-sm font-medium'>{t('total')}</span>
          </div>
          <div className='flex items-center gap-2'>
            {hasComparison && (
              <>
                {totalDifference && (
                  <div className='flex items-center gap-1 text-sm font-medium'>
                    <totalTrend.icon className={cn('h-3 w-3', totalTrend.color)} fill='currentColor' />
                    <span className={totalTrend.color}>{totalDifference}</span>
                  </div>
                )}
              </>
            )}
            <span className='text-popover-foreground text-sm font-medium'>{formatter(currentTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
