import { Skeleton } from '@/components/ui/skeleton';
import { FunnelChartSkeleton } from './FunnelChartSkeleton';

export function FunnelCardSkeleton() {
  return (
    <div className='bg-card w-full gap-10 space-y-4 rounded-xl border p-2'>
      <div className='flex w-full items-center justify-between'>
        <Skeleton className='mx-1 h-7 w-48 sm:mx-2' />
        <Skeleton className='h-8 w-16' />
      </div>
      <FunnelChartSkeleton />
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
