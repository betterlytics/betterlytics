'use client';

import { cn } from '@/lib/utils';
import { getTrendInfo, formatDifference } from '@/utils/chartUtils';
import { type ComparisonMapping } from '@/types/charts';
import { formatNumber } from '@/utils/formatters';
import { usePartialBucketRange } from '@/hooks/use-partial-bucket-range';
import { useTranslations } from 'next-intl';

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
  comparisonMap?: ComparisonMapping[];
  title?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  className,
  comparisonMap,
  title,
}: ChartTooltipProps) {
  const t = useTranslations('charts.tooltip');
  const name = label || payload?.[0]?.payload.name || payload?.[0]?.payload.label;
  const comparisonData = comparisonMap?.find((mapping) => mapping.currentDate === Number(name));

  const { partialRange, comparePartialRange } = usePartialBucketRange(name, comparisonData?.compareDate);

  if (!active || !payload || !payload.length) {
    return null;
  }

  const primaryValue = payload[0].payload.value[0];
  if (primaryValue == null) {
    return null;
  }

  const labelColor = payload[0].payload.color;

  const value = payload[0].value;

  const previousValue = comparisonData
    ? Object.values(comparisonData.compareValues)[0]
    : ((payload[1]?.value || payload[0].payload.value[1]) as number);

  const hasComparison = previousValue !== undefined;
  const trendInfo = getTrendInfo(value, previousValue || 0, hasComparison);

  const formattedDifference = formatDifference(value, previousValue || 0, hasComparison, formatter);
  const previousDateLabel = comparisonData ? labelFormatter(comparisonData.compareDate) : undefined;
  const previousColor = 'var(--chart-comparison)';

  return (
    <div
      className={cn(
        'border-border bg-popover/95 min-w-[200px] rounded-lg border p-3 shadow-xl backdrop-blur-sm',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className,
      )}
    >
      {title && <div className='text-popover-foreground mb-2 text-sm font-medium'>{title}</div>}
      <div className='space-y-1.5'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary h-2 w-2 rounded-full' style={{ background: labelColor }} />
            <div>
              <span className='text-popover-foreground text-sm'>{labelFormatter(name)}</span>
              {partialRange && (
                <div className='text-muted-foreground/60 text-xs'>
                  (<span className='italic'>{t('partial')}: </span>
                  {partialRange})
                </div>
              )}
            </div>
          </div>
          <div className='text-popover-foreground text-sm font-medium'>
            {formatter ? formatter(value) : formatNumber(value)}
          </div>
        </div>

        {hasComparison && previousDateLabel !== undefined && (
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <div className='bg-muted-foreground/40 h-2 w-2 rounded-full' style={{ background: previousColor }} />
              <div>
                <span className='text-popover-foreground/60 text-sm'>{previousDateLabel}</span>
                {comparePartialRange && (
                  <div className='text-muted-foreground/60 text-xs'>
                    (<span className='italic'>{t('partial')}: </span>
                    {comparePartialRange})
                  </div>
                )}
              </div>
            </div>
            <div className='text-popover-foreground/60 text-sm'>
              {formatter ? formatter(previousValue as number) : formatNumber(previousValue as number)}
            </div>
          </div>
        )}
      </div>

      {formattedDifference && (
        <div className='mt-2 flex items-center gap-1 text-sm'>
          <trendInfo.icon className={cn('h-3.5 w-3.5', trendInfo.color)} fill='currentColor' />
          <span className={cn('font-semibold', trendInfo.color)}>{formattedDifference}</span>
        </div>
      )}
    </div>
  );
}
