'use client';

import { Card } from '@/components/ui/card';
import { formatElapsedTime } from '@/utils/dateFormatters';
import { ErrorMiniBarChart } from './ErrorMiniBarChart';
import type { ErrorGroupRow } from '@/entities/analytics/errors.entities';
import type { BarChartPoint } from '@/presenters/toBarChart';

type ErrorCardProps = {
  error: ErrorGroupRow;
  volume: BarChartPoint[];
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

export function ErrorCard({ error, volume }: ErrorCardProps) {
  const lastSeenLabel = formatElapsedTime(error.last_seen);

  return (
    <Card className='border-border/70 bg-card/80 overflow-hidden py-3 sm:py-4'>
      <div className='flex flex-col gap-2 px-4 md:hidden'>
        <div className='min-w-0'>
          <span className='text-sm font-semibold'>{error.error_type}</span>
          <p className='text-muted-foreground mt-0.5 line-clamp-2 break-all text-sm'>{error.error_message}</p>
        </div>
        <ErrorMiniBarChart data={volume} width={200} height={32} />
        <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
          <span className='font-semibold'>{formatCount(error.count)} events</span>
          <span>&middot;</span>
          <span>{formatCount(error.session_count)} sessions</span>
          <span>&middot;</span>
          <span>Last seen {lastSeenLabel} ago</span>
        </div>
      </div>

      <div className='hidden px-5 md:flex md:items-center md:gap-6'>
        <div className='min-w-0 flex-1'>
          <span className='text-sm font-semibold'>{error.error_type}</span>
          <p className='text-muted-foreground mt-0.5 truncate text-sm'>{error.error_message}</p>
        </div>

        <div className='shrink-0'>
          <ErrorMiniBarChart data={volume} />
        </div>

        <div className='w-36 shrink-0 text-right'>
          <p className='text-sm font-semibold'>{formatCount(error.count)} events</p>
          <p className='text-muted-foreground text-xs'>
            {formatCount(error.session_count)} sessions &middot; {lastSeenLabel} ago
          </p>
        </div>
      </div>
    </Card>
  );
}
