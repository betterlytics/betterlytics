'use client';

import { Fragment, useMemo, useCallback, useState, type CSSProperties } from 'react';
import type { HeatmapMetric } from '@/entities/analytics/weeklyHeatmap.entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { type WeeklyHeatmapMatrix } from '@/presenters/toWeeklyHeatmapMatrix';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDuration } from '@/utils/dateFormatters';
import type { SupportedLanguages } from '@/constants/i18n';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useColorScale } from '@/hooks/use-color-scale';
import { formatNumber, formatPercentage } from '@/utils/formatters';
import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';
import { useBAQuery } from '@/trpc/hooks';

const metricOptions = [
  { value: 'pageviews', labelKey: 'pageviews' },
  { value: 'unique_visitors', labelKey: 'uniqueVisitors' },
  { value: 'sessions', labelKey: 'sessions' },
  { value: 'bounce_rate', labelKey: 'bounceRate' },
  { value: 'pages_per_session', labelKey: 'pagesPerSession' },
  { value: 'session_duration', labelKey: 'sessionDuration' },
] as const;

function formatHeatmapMetricValue(metric: HeatmapMetric, value: number, locale: SupportedLanguages): string {
  switch (metric) {
    case 'session_duration':
      return formatDuration(Math.round(value), locale);
    case 'bounce_rate':
      return formatPercentage(value, locale);
    default:
      return formatNumber(value, locale);
  }
}

export default function WeeklyHeatmapSection() {
  const [selectedMetric, setSelectedMetric] = useState<HeatmapMetric>('unique_visitors');
  const t = useTranslations('dashboard');

  const query = useBAQuery((t, input, opts) =>
    t.weeklyHeatmap.heatmap.useQuery({ ...input, metric: selectedMetric }, opts),
  );

  const metricLabelByMetric: Record<HeatmapMetric, string> = useMemo(
    () => ({
      pageviews: t('metrics.totalPageviews'),
      unique_visitors: t('metrics.uniqueVisitors'),
      sessions: t('metrics.sessions'),
      bounce_rate: t('metrics.bounceRate'),
      pages_per_session: t('metrics.pagesPerSession'),
      session_duration: t('metrics.sessionDuration'),
    }),
    [t],
  );

  const onMetricChange = (next: string) => {
    setSelectedMetric(next as HeatmapMetric);
  };

  const isLoading = query.isFetching && !query.data;

  return (
    <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:p-6 sm:pt-4 sm:pb-4'>
      <CardHeader className='px-0 pb-1'>
        <div className='flex flex-row items-center justify-between gap-2'>
          <CardTitle className='text-base font-medium whitespace-nowrap'>
            <span className='inline-flex items-center gap-2'>
              {t('sections.weeklyTrends')}
              {query.isFetching && !!query.data && <Spinner size='sm' />}
            </span>
          </CardTitle>
          <div className='flex h-8 min-w-0 items-center'>
            <div className='w-40 sm:w-48'>
              <Select value={selectedMetric} onValueChange={onMetricChange}>
                <SelectTrigger size='sm' className='w-full cursor-pointer overflow-hidden'>
                  <span className='block truncate'>
                    <SelectValue placeholder='Select metric' />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {metricOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className='cursor-pointer'>
                      {metricLabelByMetric[opt.value as HeatmapMetric]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col px-0'>
        {isLoading ? (
          <div className='grid grid-cols-[40px_repeat(7,1fr)] gap-x-0.5 gap-y-1 pb-3'>
            <div></div>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={`day-${i}`} className='mx-auto mb-1 h-3 w-10 rounded' />
            ))}
            {Array.from({ length: 24 }).map((_, hourIndex) => (
              <Fragment key={`row-${hourIndex}`}>
                <div className='flex h-2.5 items-center justify-end pr-2'>
                  {hourIndex % 3 === 1 ? <Skeleton className='h-2 w-6 rounded' /> : null}
                </div>
                {Array.from({ length: 7 }).map((_, dayIndex) => (
                  <Skeleton key={`cell-${hourIndex}-${dayIndex}`} className='h-2.5 w-full rounded-sm' />
                ))}
              </Fragment>
            ))}
          </div>
        ) : (
          <div className='relative'>
            {query.isFetching && !!query.data && (
              <div className='absolute inset-0 z-10 flex items-center justify-center'>
                <Spinner />
              </div>
            )}
            <div className={cn('h-full', query.isFetching && !!query.data && 'pointer-events-none opacity-60')}>
              <HeatmapGrid
                data={query.data?.matrix ?? []}
                maxValue={query.data?.maxValue ?? 1}
                metricLabel={metricLabelByMetric[selectedMetric]}
                metric={selectedMetric}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type HeatmapGridProps = {
  data: WeeklyHeatmapMatrix[];
  maxValue: number;
  metricLabel: string;
  metric: HeatmapMetric;
};

function HeatmapGrid({ data, maxValue, metricLabel, metric }: HeatmapGridProps) {
  const locale = useLocale();
  const dayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(Date.UTC(1970, 0, 5 + i))));
  }, [locale]);

  const colorScale = useColorScale({
    maxValue,
    scaleType: 'lab',
    colors: ['--weekly-heatmap-fill-low', '--weekly-heatmap-fill-high'],
  });

  const getCellStyle = useCallback(
    (value: number): CSSProperties => {
      if (value <= 0 || !colorScale) {
        return { backgroundColor: 'var(--weekly-heatmap-fill-none)', opacity: 0.85 };
      }
      return { backgroundColor: colorScale(value) };
    },
    [colorScale],
  );

  return (
    <div className='grid grid-cols-[40px_repeat(7,1fr)] gap-x-1 gap-y-1 pb-3'>
      <div></div>
      {dayLabels.map((label) => (
        <div
          key={label}
          className='text-muted-foreground truncate pb-1 text-center text-[10px] leading-none font-medium'
        >
          {label}
        </div>
      ))}

      {Array.from({ length: 24 }).map((_, hourIndex) => (
        <Fragment key={`hour-${hourIndex}`}>
          <div className='text-muted-foreground flex h-2.5 items-center justify-end pr-1 text-xs leading-none'>
            {hourIndex % 3 === 1 ? `${String(hourIndex).padStart(2, '0')}:00` : ''}
          </div>
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const value = data[dayIndex]?.hours[hourIndex] ?? 0;
            return (
              <Tooltip key={`${hourIndex}-${dayIndex}`} delayDuration={0} disableHoverableContent>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'hover:ring-foreground/60 h-2.5 w-full rounded-[2px] transition-colors ring-inset hover:ring-2',
                      value <= 0 && 'bg-gray-500/10 dark:bg-gray-400/20',
                    )}
                    style={getCellStyle(value)}
                    aria-label={`${dayLabels[dayIndex]} ${String(hourIndex).padStart(2, '0')}:00 value ${value}`}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side='top'
                  className='border-border bg-popover/95 text-popover-foreground pointer-events-none rounded-lg border p-2.5 shadow-xl backdrop-blur-sm'
                >
                  <div>
                    <div className='text-popover-foreground font-medium'>
                      {`${dayLabels[dayIndex]} ${String(hourIndex).padStart(2, '0')}:00 - ${String((hourIndex + 1) % 24).padStart(2, '0')}:00`}
                    </div>
                    <div className='text-popover-foreground/90'>
                      {`${formatHeatmapMetricValue(metric, value, locale)} ${metricLabel.toLowerCase()}`}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
