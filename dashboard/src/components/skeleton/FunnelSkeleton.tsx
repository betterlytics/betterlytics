import { Skeleton } from '@/components/ui/skeleton';

export default function FunnelSkeleton() {
  return (
    <div className='bg-card rounded-lg border p-6'>
      <div className='mb-4 flex items-center gap-3'>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-5 w-16' />
      </div>
      <div className='grid grid-cols-4 gap-2'>
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-12 w-full' />
        <Skeleton className='h-12 w-full' />
      </div>
    </div>
  );
}
