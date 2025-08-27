'use client';

import { cn } from '@/lib/utils';
import { getTrendInfo, formatDifference } from '@/utils/chartUtils';
import { type ComparisonMapping } from '@/types/charts';
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
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  className,
  comparisonMap,
}: ChartTooltipProps) {
  const t = useTranslations('charts.tooltip');

  if (!active || !payload || !payload.length) {
    return null;
  }
  const name = label || payload[0].payload.name || payload[0].payload.label;

  const labelColor = payload[0].payload.color;

  const value = payload[0].value;

  const comparisonData = comparisonMap?.find((mapping) => mapping.currentDate === Number(name));
  const previousValue = comparisonData
    ? Object.values(comparisonData.compareValues)[0]
    : ((payload[1]?.value || payload[0].payload.value[1]) as number);

  const hasComparison = previousValue !== undefined;
  const trendInfo = getTrendInfo(value, previousValue || 0, hasComparison);
  const { icon: TrendIcon, color: trendColor, bgColor: trendBgColor } = trendInfo;

  const formattedDifference = formatDifference(value, previousValue || 0, hasComparison, formatter);
  return (
    <div
      className={cn(
        'border-border bg-popover/95 min-w-[200px] rounded-lg border p-4 shadow-xl backdrop-blur-sm',
        'animate-in fade-in-0 zoom-in-95 duration-200',
        className,
      )}
    >
      <div className='border-border mb-3 border-b pb-2'>
        <div className='mb-1 flex items-center gap-2'>
          <div className='bg-primary h-2 w-2 rounded-full' style={{ background: labelColor }}></div>
          <span className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
            {labelFormatter(name)}
          </span>
        </div>
        {hasComparison && comparisonData && (
          <div className='text-muted-foreground text-xs'>
            {t('vs')} {labelFormatter(comparisonData.compareDate)}
          </div>
        )}
      </div>

      <div className='mb-3'>
        <div className='text-muted-foreground mb-1 text-xs'>{t('currentPeriod')}</div>
        <div className='text-popover-foreground text-lg font-semibold'>{formatter ? formatter(value) : value}</div>
      </div>

      {previousValue !== undefined && (
        <div className='space-y-2'>
          <div className='text-muted-foreground text-xs'>{t('previousPeriod')}</div>
          <div className='flex items-center justify-between'>
            <span className='text-popover-foreground/80 text-sm'>
              {formatter ? formatter(previousValue) : previousValue}
            </span>
          </div>

          {formattedDifference && (
            <div className={cn('flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium', trendBgColor)}>
              <TrendIcon className={cn('h-3 w-3', trendColor)} fill='currentColor' />
              <span className={trendColor}>{formattedDifference}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
