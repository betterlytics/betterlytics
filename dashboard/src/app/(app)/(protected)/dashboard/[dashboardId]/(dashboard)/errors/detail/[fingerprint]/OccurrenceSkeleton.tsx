import { Skeleton } from '@/components/ui/skeleton';

export function OccurrenceSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='divide-border -mx-6 flex divide-x'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='flex min-w-0 flex-1 items-center gap-3 px-6 py-1'>
            <Skeleton className='h-11 w-11 rounded-xl' />
            <div className='space-y-1.5'>
              <Skeleton className='h-3 w-12' />
              <Skeleton className='h-4 w-20' />
            </div>
          </div>
        ))}
      </div>
      <div className='border-border space-y-2 border-t pt-6'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-32 w-full rounded-lg' />
      </div>
    </div>
  );
}
