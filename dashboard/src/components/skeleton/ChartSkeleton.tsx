import { Skeleton } from '@/components/ui/skeleton';

export default function ChartSkeleton() {
  return (
    <div className='bg-card rounded-xl border p-6'>
      <Skeleton className='mb-6 h-6 w-1/4' />
      <Skeleton className='h-80 w-full' />
    </div>
  );
}
