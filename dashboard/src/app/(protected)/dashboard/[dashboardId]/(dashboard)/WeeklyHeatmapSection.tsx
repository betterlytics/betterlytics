'use client';

import { Fragment, useMemo, useState, type CSSProperties, useCallback, useEffect } from 'react';
import { fetchWeeklyHeatmapAllAction } from '@/app/actions/analytics/weeklyHeatmap.actions';
import type { HeatmapMetric } from '@/entities/analytics/weeklyHeatmap.entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { cn } from '@/lib/utils';
import { type WeeklyHeatmapMatrix, type PresentedWeeklyHeatmap } from '@/presenters/toWeeklyHeatmapMatrix';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDuration } from '@/utils/dateFormatters';
import { useLocale, useTranslations } from 'next-intl';
import { QueryFilter } from '@/entities/analytics/filter.entities';
import { HeatmapSkeleton } from '@/components/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useColorScale } from '@/hooks/use-color-scale';
import { formatNumber } from '@/utils/formatters';

type WeeklyHeatmapSectionProps = {
  dashboardId: string;
  startDate: Date;
  endDate: Date;
  queryFilters: QueryFilter[];
};

const metricOptions = [
  { value: 'pageviews', labelKey: 'pageviews' },
  { value: 'unique_visitors', labelKey: 'uniqueVisitors' },
  { value: 'sessions', labelKey: 'sessions' },
  { value: 'bounce_rate', labelKey: 'bounceRate' },
  { value: 'pages_per_session', labelKey: 'pagesPerSession' },
  { value: 'session_duration', labelKey: 'sessionDuration' },
] as const;

function formatHeatmapMetricValue(metric: HeatmapMetric, value: number): string {
  switch (metric) {
    case 'session_duration':
      return formatDuration(Math.round(value));
    case 'bounce_rate':
      return `${value}%`;
    default:
      return formatNumber(value);
  }
}

export default function WeeklyHeatmapSection({
  dashboardId,
  startDate,
  endDate,
  queryFilters,
}: WeeklyHeatmapSectionProps) {
  const [allData, setAllData] = useState<Awaited<ReturnType<typeof fetchWeeklyHeatmapAllAction>>>();
  useEffect(() => {
    fetchWeeklyHeatmapAllAction(
      dashboardId,
      startDate,
      endDate,
      queryFilters,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ).then((res) => setAllData(res));
  }, [dashboardId, startDate, endDate, queryFilters]);

  const [selectedMetric, setSelectedMetric] = useState<HeatmapMetric>('unique_visitors');
  const t = useTranslations('dashboard');

  const current: PresentedWeeklyHeatmap | undefined = useMemo(() => {
    const pair = allData?.find(([metric]) => metric === selectedMetric);
    return pair ? pair[1] : undefined;
  }, [allData, selectedMetric]);

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

  const selectedMetricLabel = metricLabelByMetric[selectedMetric];

  const onMetricChange = (next: string) => {
    setSelectedMetric(next as HeatmapMetric);
  };

  if (!allData) {
    return <HeatmapSkeleton />;
  }

  return (
    <Card variant='section' minHeight='chart'>
      <CardHeader className='px-0 pb-1'>
        <div className='flex flex-row items-center justify-between gap-2'>
          <CardTitle className='whitespace-nowrap'>{t('sections.weeklyTrends')}</CardTitle>
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

      <CardContent>
        <HeatmapGrid
          data={current?.matrix ?? []}
          maxValue={current?.maxValue ?? 1}
          metricLabel={selectedMetricLabel}
          metric={selectedMetric}
        />
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
    // Monday-first sequence, matching data mapping (1..7 Mon..Sun)
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
                  className='border-border bg-popover/95 pointer-events-none rounded-lg border p-2.5 shadow-xl backdrop-blur-sm'
                >
                  <div className='text-popover-foreground font-medium'>
                    {`${dayLabels[dayIndex]} ${String(hourIndex).padStart(2, '0')}:00 - ${String((hourIndex + 1) % 24).padStart(2, '0')}:00`}
                  </div>
                  <div className='text-popover-foreground/90'>
                    {`${formatHeatmapMetricValue(metric, value)} ${metricLabel.toLowerCase()}`}
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
