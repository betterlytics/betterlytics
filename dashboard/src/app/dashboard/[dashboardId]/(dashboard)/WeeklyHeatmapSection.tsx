'use client';

import { Fragment, use, useMemo, useState, type CSSProperties } from 'react';
import { fetchWeeklyHeatmapAllAction } from '@/app/actions/weeklyHeatmap';
import type { HeatmapMetric } from '@/entities/weeklyHeatmap';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { type WeeklyHeatmapMatrix, type WeeklyHeatmapPrepared } from '@/presenters/toWeeklyHeatmapMatrix';

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

  const current: WeeklyHeatmapPrepared | undefined = useMemo(() => {
    const pair = allData.find(([metric]) => metric === selectedMetric);
    return pair ? pair[1] : undefined;
  }, [allData, selectedMetric]);

  const onMetricChange = (next: string) => {
    setSelectedMetric(next as HeatmapMetric);
  };

  return (
    <div className='bg-card border-border rounded-lg border p-6 shadow'>
      <div className='mb-4 flex items-center justify-between'>
        <div>
          <h2 className='text-foreground mb-1 text-lg font-bold'>Weekly Trends</h2>
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

      <HeatmapGrid data={current?.matrix ?? []} maxValue={current?.maxValue ?? 1} />
    </div>
  );
}

type HeatmapGridProps = {
  data: WeeklyHeatmapMatrix[];
  maxValue: number;
};

export const mockWeeklyHeatmap: WeeklyHeatmapMatrix[] = [
  {
    weekday: 1, // Monday
    hours: [0, 0, 0, 0, 1, 2, 4, 8, 12, 15, 18, 20, 22, 18, 15, 12, 10, 8, 6, 4, 3, 2, 1, 0],
  },
  {
    weekday: 2, // Tuesday
    hours: [0, 0, 0, 0, 1, 2, 5, 10, 14, 18, 20, 22, 24, 20, 18, 15, 12, 9, 7, 5, 3, 2, 1, 0],
  },
  {
    weekday: 3, // Wednesday
    hours: [0, 0, 0, 0, 2, 3, 6, 12, 16, 20, 22, 24, 26, 22, 20, 16, 14, 10, 8, 6, 4, 3, 2, 0],
  },
  {
    weekday: 4, // Thursday
    hours: [0, 0, 0, 0, 1, 2, 5, 9, 14, 17, 19, 21, 23, 19, 16, 12, 9, 7, 6, 4, 3, 2, 1, 0],
  },
  {
    weekday: 5, // Friday
    hours: [0, 0, 0, 0, 1, 2, 4, 8, 12, 15, 20, 24, 282, 25, 22, 18, 14, 12, 10, 8, 6, 4, 2, 0],
  },
  {
    weekday: 6, // Saturday
    hours: [0, 0, 0, 0, 1, 1, 2, 4, 8, 10, 12, 15, 18, 15, 12, 10, 8, 6, 4, 3, 2, 1, 0, 0],
  },
  {
    weekday: 7, // Sunday
    hours: [0, 0, 0, 0, 1, 1, 2, 3, 5, 7, 9, 10, 12, 10, 8, 6, 5, 4, 3, 2, 2, 1, 0, 0],
  },
];

function HeatmapGrid({ data, maxValue }: HeatmapGridProps) {
  data = mockWeeklyHeatmap;
  maxValue = 282;
  const dayLabels = ['Mon.', 'Tue.', 'Wed.', 'Thu.', 'Fri.', 'Sat.', 'Sun.'];

  const effectiveMax = Math.max(1, maxValue);

  const getCellStyle = (value: number): CSSProperties => {
    if (value <= 0) return {};

    const t = Math.log1p(value) / Math.log1p(effectiveMax);
    const eased = Math.pow(t, 0.85);

    return {
      backgroundColor: `oklch(62% 0.17 268.71 / ${0.1 + 0.9 * eased})`,
    };
  };

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
              <div
                key={`${hourIndex}-${dayIndex}`}
                className={cn(
                  'hover:ring-primary/60 h-2.5 w-full rounded-sm transition-colors ring-inset hover:ring-1',
                  value <= 0 && 'bg-gray-500/10 dark:bg-gray-400/20',
                )}
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
