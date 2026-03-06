'use client';

import { Card } from '@/components/ui/card';
import { formatElapsedTime } from '@/utils/dateFormatters';
import { ErrorMiniBarChart } from './ErrorMiniBarChart';
import type { ErrorGroupRow } from '@/entities/analytics/errors.entities';
import type { TimeSeriesPoint } from '@/presenters/toTimeSeries';

const RECENT_THRESHOLD_MS = 60 * 60 * 1000;

type ErrorCardProps = {
  error: ErrorGroupRow;
  volume: TimeSeriesPoint[];
};

function formatCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

function ErrorMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex min-w-[6rem] flex-col items-center'>
      <span className='text-muted-foreground text-[10px] leading-tight font-medium tracking-wide uppercase'>
        {label}
      </span>
      <span className='text-foreground text-sm font-semibold tabular-nums'>{value}</span>
    </div>
  );
}

export function ErrorCard({ error, volume }: ErrorCardProps) {
  const lastSeenLabel = formatElapsedTime(error.last_seen);
  const firstSeenLabel = error.first_seen ? formatElapsedTime(error.first_seen) : null;
  const isRecent = Date.now() - error.last_seen.getTime() < RECENT_THRESHOLD_MS;

  return (
    <Card className='border-border/70 bg-card/80 overflow-hidden py-3 sm:py-4'>
      {/* Mobile layout */}
      <div className='flex flex-col gap-1.5 px-4 md:hidden'>
        <div className='flex min-w-0 items-center gap-2'>
          {isRecent && <span className='bg-destructive h-1.5 w-1.5 shrink-0 animate-pulse rounded-full' />}
          <span className='text-sm font-semibold'>{error.error_type}</span>
        </div>
        <p className='text-muted-foreground line-clamp-2 break-all text-sm'>{error.error_message}</p>
        <div className='text-muted-foreground flex flex-wrap items-center gap-x-3 text-xs'>
          <span className='font-medium tabular-nums'>{formatCount(error.count)} occurrences</span>
          <span className='font-medium tabular-nums'>{formatCount(error.session_count)} sessions</span>
          {firstSeenLabel && <span>first {firstSeenLabel} ago</span>}
          <span>last {lastSeenLabel} ago</span>
        </div>
      </div>

      {/* Desktop layout */}
      <div className='hidden px-5 md:flex md:items-center md:gap-6'>
        <div className='min-w-0 flex-1'>
          <div className='mb-0.5 flex items-center gap-2'>
            {isRecent && <span className='bg-destructive h-1.5 w-1.5 shrink-0 animate-pulse rounded-full' />}
            <span className='text-sm font-semibold'>{error.error_type}</span>
          </div>
          <p className='text-muted-foreground truncate text-sm'>{error.error_message}</p>
        </div>

        <div className='hidden shrink-0 lg:block'>
          <ErrorMiniBarChart data={volume} />
        </div>

        <div className='flex shrink-0 items-end gap-4'>
          <ErrorMetric label='Occurrences' value={formatCount(error.count)} />
          <ErrorMetric label='Sessions' value={formatCount(error.session_count)} />
          <ErrorMetric label='First seen' value={firstSeenLabel ? `${firstSeenLabel} ago` : '—'} />
          <ErrorMetric label='Last seen' value={`${lastSeenLabel} ago`} />
        </div>
      </div>
    </Card>
  );
}
