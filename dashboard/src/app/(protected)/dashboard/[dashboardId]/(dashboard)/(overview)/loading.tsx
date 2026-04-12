import { SummaryCardsSkeleton, ChartSkeleton, TableSkeleton } from '@/components/skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className='container space-y-4 p-2 sm:p-6'>
      <div className='mb-4 flex flex-col justify-between gap-2 lg:flex-row'>
        <Skeleton className='h-7 w-32' />
        <Skeleton className='h-9 w-64' />
      </div>

      <SummaryCardsSkeleton />
      <ChartSkeleton chartOnly />

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <TableSkeleton />
        <TableSkeleton />
        <TableSkeleton />
        <TableSkeleton />
      </div>
    </div>
  );
}
