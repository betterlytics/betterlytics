'use client';

import { Fragment, use, useMemo, useState, type CSSProperties } from 'react';
import { fetchWeeklyHeatmapAllAction } from '@/app/actions/weeklyHeatmap';
import type { HeatmapMetric } from '@/entities/weeklyHeatmap';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { type WeeklyHeatmapMatrix } from '@/presenters/toWeeklyHeatmapMatrix';

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

  const currentData: WeeklyHeatmapMatrix[] = useMemo(() => {
    const pair = allData.find(([metric]) => metric === selectedMetric);
    return pair ? pair[1] : [];
  }, [allData, selectedMetric]);

  const onMetricChange = (next: string) => {
    setSelectedMetric(next as HeatmapMetric);
  };

  return (
    <div className='bg-card border-border rounded-lg border p-6 shadow'>
      <div className='mb-4 flex items-center justify-between'>
        <div>
          <h2 className='text-foreground mb-1 text-lg font-bold'>Weekly Trends</h2>
          <p className='text-muted-foreground text-sm'>Activity by weekday and hour</p>
        </div>
        <div className='w-48'>
          <Select value={selectedMetric} onValueChange={onMetricChange}>
            <SelectTrigger>
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

      <HeatmapGrid data={currentData} />
    </div>
  );
}

type HeatmapGridProps = {
  data: WeeklyHeatmapMatrix[];
};

function HeatmapGrid({ data }: HeatmapGridProps) {
  const dayLabels = ['Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.', 'Sun.'];

  // Use p95 to avoid outliers washing out the gradient
  const allValues = data.flatMap((d) => d.hours);
  const sorted = [...allValues].sort((a, b) => a - b);
  const p95Index = Math.max(0, Math.floor(0.95 * (sorted.length - 1)));
  const scaleMax = Math.max(1, sorted.length ? sorted[p95Index] : 1);

  const getCellStyle = (value: number): CSSProperties => {
    const t = Math.min(1, value / scaleMax);
    const percent = Math.round(t * 100);
    return { background: `color-mix(in oklch, var(--primary) ${percent}%, transparent)` };
  };

  return (
    <div className='grid grid-cols-[40px_repeat(7,80px)] gap-x-0.5 gap-y-1'>
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
              <div
                key={`${hourIndex}-${dayIndex}`}
                className={cn('h-2.5 w-full rounded-sm ring-1 ring-gray-700/50 transition-colors ring-inset')}
                style={getCellStyle(value)}
                title={`${dayLabels[dayIndex]} ${String(hourIndex).padStart(2, '0')}:00 - ${value}`}
                aria-label={`${dayLabels[dayIndex]} ${String(hourIndex).padStart(2, '0')}:00 value ${value}`}
              />
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
