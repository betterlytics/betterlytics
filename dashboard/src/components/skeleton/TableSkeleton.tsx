import { Skeleton } from '@/components/ui/skeleton';

export default function TableSkeleton() {
  return (
    <div className='bg-card rounded-xl border p-6'>
      <Skeleton className='mb-6 h-6 w-1/3' />
      <div className='space-y-4'>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className='flex justify-between'>
            <Skeleton className='h-4 w-2/3' />
            <Skeleton className='h-4 w-1/4' />
          </div>
        ))}
      </div>
    </div>
  );
}
