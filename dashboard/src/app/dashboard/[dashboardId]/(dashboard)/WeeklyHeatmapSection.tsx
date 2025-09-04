'use client';

import { Fragment, use, useMemo, useState, type CSSProperties, useCallback } from 'react';
import { fetchWeeklyHeatmapAllAction } from '@/app/actions/weeklyHeatmap';
import type { HeatmapMetric } from '@/entities/weeklyHeatmap';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { type WeeklyHeatmapMatrix, type PresentedWeeklyHeatmap } from '@/presenters/toWeeklyHeatmapMatrix';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDuration } from '@/utils/dateFormatters';

type WeeklyHeatmapSectionProps = {
  weeklyHeatmapAllPromise: ReturnType<typeof fetchWeeklyHeatmapAllAction>;
};

const metricOptions = [
  { value: 'pageviews', labelKey: 'pageviews' },
  { value: 'unique_visitors', labelKey: 'uniqueVisitors' },
  { value: 'sessions', labelKey: 'sessions' },
  { value: 'bounce_rate', labelKey: 'bounceRate' },
  { value: 'pages_per_session', labelKey: 'pagesPerSession' },
  { value: 'session_duration', labelKey: 'sessionDuration' },
] as const;

export default function WeeklyHeatmapSection(props: WeeklyHeatmapSectionProps) {
  const allData = use(props.weeklyHeatmapAllPromise);
  const [selectedMetric, setSelectedMetric] = useState<HeatmapMetric>('unique_visitors');

  const current: PresentedWeeklyHeatmap | undefined = useMemo(() => {
    const pair = allData.find(([metric]) => metric === selectedMetric);
    return pair ? pair[1] : undefined;
  }, [allData, selectedMetric]);

  const selectedMetricLabel = {
    pageviews: 'Pageviews',
    unique_visitors: 'Unique Visitors',
    sessions: 'Sessions',
    bounce_rate: 'Bounce Rate',
    pages_per_session: 'Pages / Session',
    session_duration: 'Session Duration',
  }[selectedMetric];

  const onMetricChange = (next: string) => {
    setSelectedMetric(next as HeatmapMetric);
  };

  return (
    <div className='bg-card border-border rounded-lg border p-6 shadow'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h2 className='text-foreground mb-1 text-lg font-bold'>Weekly Trends</h2>
        </div>
        <div className='w-36'>
          <Select value={selectedMetric} onValueChange={onMetricChange}>
            <SelectTrigger className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {metricOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {
                    {
                      pageviews: 'Pageviews',
                      unique_visitors: 'Unique Visitors',
                      sessions: 'Sessions',
                      bounce_rate: 'Bounce Rate',
                      pages_per_session: 'Pages / Session',
                      session_duration: 'Session Duration',
                    }[opt.value]
                  }
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <HeatmapGrid
        data={current?.matrix ?? []}
        maxValue={current?.maxValue ?? 1}
        metricLabel={selectedMetricLabel}
        metric={selectedMetric}
      />
    </div>
  );
}

type HeatmapGridProps = {
  data: WeeklyHeatmapMatrix[];
  maxValue: number;
  metricLabel: string;
  metric: HeatmapMetric;
};

function HeatmapGrid({ data, maxValue, metricLabel, metric }: HeatmapGridProps) {
  const dayLabels = ['Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.', 'Sun.'];

  const effectiveMax = Math.max(1, maxValue);

  const getCellStyle = useCallback(
    (value: number): CSSProperties => {
      if (value <= 0) return {};

      const t = Math.log1p(value) / Math.log1p(effectiveMax);
      const eased = Math.pow(t, 0.85) * 0.9 + 0.1;

      return {
        backgroundColor: `oklch(62% 0.17 268.71 / ${eased})`,
      };
    },
    [effectiveMax],
  );

  return (
    <div className='grid grid-cols-[40px_repeat(7,1fr)] gap-x-0.5 gap-y-1'>
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
          <div className='text-muted-foreground flex h-2.5 items-center justify-end pr-2 text-xs leading-none'>
            {hourIndex % 3 === 1 ? String(hourIndex).padStart(2, '0') : ''}
          </div>
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const value = data[dayIndex]?.hours[hourIndex] ?? 0;
            return (
              <Tooltip key={`${hourIndex}-${dayIndex}`}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'hover:ring-primary/60 h-2.5 w-full rounded-sm transition-colors ring-inset hover:ring-1',
                      value <= 0 && 'bg-gray-500/10 dark:bg-gray-400/20',
                    )}
                    style={getCellStyle(value)}
                    aria-label={`${dayLabels[dayIndex]} ${String(hourIndex).padStart(2, '0')}:00 value ${value}`}
                  />
                </TooltipTrigger>
                <TooltipContent
                  side='top'
                  className='border-border bg-popover/95 text-popover-foreground rounded-lg border p-2.5 shadow-xl backdrop-blur-sm'
                >
                  <div>
                    <div className='text-popover-foreground font-medium'>
                      {`${dayLabels[dayIndex]} ${hourIndex}:00 - ${(hourIndex + 1) % 24}:00`}
                    </div>
                    <div className='text-popover-foreground/90'>
                      {`${metric === 'session_duration' ? formatDuration(Math.round(value)) : value} ${metricLabel.toLowerCase()}`}
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
