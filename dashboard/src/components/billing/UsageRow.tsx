'use client';

import type { ReactNode } from 'react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type UsageSegment = {
  key: string;
  label: string;
  value: string;
  percentageOfLimit: number;
  color: string;
};

type UsageRowProps = {
  label: ReactNode;
  value: ReactNode;
  percentageOfLimit: number;
  segments?: UsageSegment[];
  valueClassName?: string;
};

export function UsageRow({ label, value, percentageOfLimit, segments, valueClassName }: UsageRowProps) {
  let cursor = 0;
  const stops = (segments ?? []).map((segment) => {
    const start = cursor;
    cursor = Math.min(cursor + segment.percentageOfLimit, 100);
    return { ...segment, start, end: cursor };
  });
  const gradient =
    cursor > 0
      ? `linear-gradient(to right, ${stops
          .map((stop) => `${stop.color} ${(stop.start / cursor) * 100}% ${(stop.end / cursor) * 100}%`)
          .join(', ')})`
      : undefined;

  return (
    <div className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 md:grid-cols-[minmax(0,1fr)_minmax(110px,20rem)_7.5rem]'>
      {label}
      {stops.length > 0 ? (
        <TooltipProvider delayDuration={150} disableHoverableContent>
          <div
            role='progressbar'
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(percentageOfLimit, 100)}
            className='bg-primary/18 dark:bg-primary/20 relative order-last col-span-2 h-1.5 w-full overflow-hidden rounded-full md:order-none md:col-span-1'
          >
            {gradient && (
              <div className='h-full rounded-full' style={{ width: `${cursor}%`, background: gradient }} />
            )}
            <div className='absolute inset-0 flex'>
              {stops.map((stop) => (
                <Tooltip key={stop.key}>
                  <TooltipTrigger asChild>
                    <div style={{ width: `${stop.end - stop.start}%` }} />
                  </TooltipTrigger>
                  <TooltipContent className='px-2.5 py-1.5 text-center'>
                    <div className='font-medium'>{stop.label}</div>
                    <div className='text-primary-foreground/75 tabular-nums'>{stop.value}</div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </TooltipProvider>
      ) : (
        <Progress
          value={Math.min(percentageOfLimit, 100)}
          color='var(--primary)'
          className='bg-primary/18 dark:bg-primary/20 order-last col-span-2 h-1.5 md:order-none md:col-span-1'
        />
      )}
      <span className={cn('text-right text-xs whitespace-nowrap tabular-nums', valueClassName)}>{value}</span>
    </div>
  );
}
