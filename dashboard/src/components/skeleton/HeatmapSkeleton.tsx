import { Skeleton } from '@/components/ui/skeleton';

export default function HeatmapSkeleton() {
  const dayCount = 7;
  const hourCount = 24;

  return (
    <div className='bg-card border-border rounded-lg border p-6 shadow'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <Skeleton className='mb-2 h-5 w-40' />
        </div>
        <Skeleton className='h-9 w-36 rounded-md' />
      </div>

      <div className='grid grid-cols-[40px_repeat(7,1fr)] gap-x-0.5 gap-y-1'>
        <div></div>
        {Array.from({ length: dayCount }).map((_, i) => (
          <Skeleton key={`day-${i}`} className='mx-auto mb-1 h-3 w-10 rounded' />
        ))}

        {Array.from({ length: hourCount }).map((_, hourIndex) => (
          <div key={`row-${hourIndex}`} className='contents'>
            <div className='flex h-2.5 items-center justify-end pr-2'>
              {hourIndex % 3 === 1 ? <Skeleton className='h-2 w-6 rounded' /> : null}
            </div>
            {Array.from({ length: dayCount }).map((_, dayIndex) => (
              <Skeleton key={`cell-${hourIndex}-${dayIndex}`} className='h-2.5 w-full rounded-sm' />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
