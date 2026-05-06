import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type InlineMetricsHeaderSkeletonProps = {
  titles?: string[];
};

export default function InlineMetricsHeaderSkeleton({ titles }: InlineMetricsHeaderSkeletonProps) {
  return (
    <div className='grid grid-cols-2 gap-1 lg:grid-cols-3 xl:grid-flow-col xl:grid-cols-none'>
      {titles?.map((title, idx) => {
        return (
          <div
            key={title}
            className={cn(
              'relative flex w-auto min-w-fit flex-col overflow-hidden rounded-md border border-transparent px-2 py-4 pt-2 text-left sm:flex-none sm:py-2 2xl:px-3',
              idx === 0 && 'bg-accent/40 border-primary/20 shadow-sm',
            )}
          >
            <span
              className='absolute top-0 left-0 h-full w-[3px] rounded-r bg-transparent'
              style={{ background: idx === 0 ? 'var(--chart-1)' : undefined }}
              aria-hidden='true'
            />
            <div className='mb-1 flex items-center justify-between'>
              <span className='text-muted-foreground text-base/tight font-medium'>{title}</span>
            </div>
            <div className='flex items-center justify-between gap-2'>
              <Skeleton className='h-8 w-16' />
            </div>
          </div>
        );
      })}
    </div>
  );
}
