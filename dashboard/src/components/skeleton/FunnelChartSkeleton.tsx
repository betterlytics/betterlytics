import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const SKELETON_BAR_HEIGHTS = [95, 62, 41, 28];

function FunnelStepSkeleton({
  barHeight,
  nextBarHeight,
  isLast,
  fill,
}: {
  barHeight: number;
  nextBarHeight?: number;
  isLast: boolean;
  fill: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col',
        fill ? 'min-w-40 flex-1' : 'w-50 shrink-0',
        !isLast && 'border-border/50 border-r',
      )}
    >
      <div className='border-border/50 space-y-1.5 border-b px-3 pt-2.5 pb-1.5'>
        <Skeleton className='h-2.5 w-10' />
        <Skeleton className='h-4 w-28' />
      </div>
      <div className={cn('flex pt-2', fill ? 'flex-1' : 'h-40')}>
        <div className='relative flex h-full w-1/2 flex-col justify-end'>
          <Skeleton className='w-full rounded-none' style={{ height: `${barHeight}%` }} />
        </div>
        {!isLast && nextBarHeight !== undefined ? (
          <svg className='h-full w-1/2' viewBox='0 0 100 100' preserveAspectRatio='none'>
            <path
              d={`M 0 ${100 - barHeight} L 100 ${100 - nextBarHeight} L 100 100 L 0 100 Z`}
              fill='color-mix(in srgb, var(--muted-foreground) 15%, transparent)'
            />
          </svg>
        ) : (
          <div className='h-full w-1/2' />
        )}
      </div>
      <div className='flex h-20'>
        <div className='flex w-1/2 flex-col items-center justify-center gap-1 p-2'>
          <Skeleton className='h-3 w-12' />
          <Skeleton className='h-5 w-14' />
          <Skeleton className='h-3 w-10' />
        </div>
        <div className='bg-muted/40 flex w-1/2 flex-col items-center justify-center gap-1 rounded-sm p-2'>
          <Skeleton className='h-3 w-12' />
          <Skeleton className='h-5 w-14' />
        </div>
      </div>
    </div>
  );
}

export function FunnelChartSkeleton({
  className,
  fill = false,
}: {
  className?: string;
  fill?: boolean;
}) {
  return (
    <div
      className={cn(
        'bg-card w-full overflow-x-auto rounded-lg border shadow-sm',
        fill && 'flex flex-1 flex-col',
        className,
      )}
    >
      <div className={cn('flex w-full min-w-fit', fill && 'flex-1')}>
        {SKELETON_BAR_HEIGHTS.map((height, i) => (
          <FunnelStepSkeleton
            key={i}
            barHeight={height}
            nextBarHeight={SKELETON_BAR_HEIGHTS[i + 1]}
            isLast={i === SKELETON_BAR_HEIGHTS.length - 1}
            fill={fill}
          />
        ))}
      </div>
    </div>
  );
}
