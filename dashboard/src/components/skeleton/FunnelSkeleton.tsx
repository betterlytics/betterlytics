import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const SKELETON_BAR_HEIGHTS = [95, 62, 41, 28];

function FunnelStepSkeleton({
  barHeight,
  nextBarHeight,
  isLast,
}: {
  barHeight: number;
  nextBarHeight?: number;
  isLast: boolean;
}) {
  return (
    <div className={cn('flex w-50 shrink-0 flex-col', !isLast && 'border-r border-border/50')}>
      <div className='space-y-1.5 border-b border-border/50 px-3 pt-2.5 pb-1.5'>
        <Skeleton className='h-2.5 w-10' />
        <Skeleton className='h-4 w-28' />
      </div>
      <div className='flex h-40 pt-2'>
        <div className='relative flex h-full w-25 flex-col justify-end'>
          <Skeleton className='w-full rounded-none' style={{ height: `${barHeight}%` }} />
        </div>
        {!isLast && nextBarHeight !== undefined ? (
          <svg className='h-full w-25' viewBox='0 0 100 100' preserveAspectRatio='none'>
            <path
              d={`M 0 ${100 - barHeight} L 100 ${100 - nextBarHeight} L 100 100 L 0 100 Z`}
              fill='color-mix(in srgb, var(--muted-foreground) 15%, transparent)'
            />
          </svg>
        ) : (
          <div className='h-full w-25' />
        )}
      </div>
      <div className='flex h-20'>
        <div className='flex w-25 flex-col items-center justify-center gap-1 p-2'>
          <Skeleton className='h-3 w-12' />
          <Skeleton className='h-5 w-14' />
          <Skeleton className='h-3 w-10' />
        </div>
        <div className='flex w-25 flex-col items-center justify-center gap-1 rounded-sm bg-muted/40 p-2'>
          <Skeleton className='h-3 w-12' />
          <Skeleton className='h-5 w-14' />
        </div>
      </div>
    </div>
  );
}

export function FunnelCardSkeleton() {
  return (
    <div className='bg-card w-full gap-10 space-y-4 rounded-xl border p-2'>
      <div className='flex w-full items-center justify-between'>
        <Skeleton className='mx-1 h-7 w-48 sm:mx-2' />
        <Skeleton className='h-8 w-16' />
      </div>
      <div className='bg-card w-full overflow-x-auto rounded-xl border shadow-sm'>
        <div className='flex'>
          {SKELETON_BAR_HEIGHTS.map((height, i) => (
            <FunnelStepSkeleton
              key={i}
              barHeight={height}
              nextBarHeight={SKELETON_BAR_HEIGHTS[i + 1]}
              isLast={i === SKELETON_BAR_HEIGHTS.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FunnelsStackSkeleton() {
  return (
    <div className='space-y-10'>
      <FunnelCardSkeleton />
      <FunnelCardSkeleton />
    </div>
  );
}
