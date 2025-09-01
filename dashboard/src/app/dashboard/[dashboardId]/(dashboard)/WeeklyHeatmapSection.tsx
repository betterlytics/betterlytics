'use client';

import { use, useMemo, useState } from 'react';
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

  const max = Math.max(1, ...data.flatMap((d) => d.hours));

  return (
    <div>
      <div className='mb-2 grid grid-cols-[60px_repeat(24,minmax(0,1fr))] items-center gap-2'>
        <div></div>
        {Array.from({ length: 24 }).map((_, h) => (
          <div key={h} className='text-muted-foreground text-center text-xs'>
            {String(h).padStart(2, '0')}
          </div>
        ))}
      </div>
      <div className='grid grid-rows-7 gap-y-2'>
        {data.map((row, index) => (
          <div key={index} className='grid grid-cols-[60px_repeat(24,minmax(0,1fr))] items-center gap-2'>
            <div className='text-muted-foreground mr-2 text-xs'>{dayLabels[row.weekday - 1]}</div>
            {row.hours.map((value, hour) => (
              <div
                key={hour}
                className={cn('h-4 rounded-sm', 'bg-emerald-900/30')}
                style={{ opacity: Math.max(0.2, value / max) }}
                aria-label={`${dayLabels[row.weekday - 1]} ${hour}:00 value ${value}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
