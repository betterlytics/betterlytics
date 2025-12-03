import { Skeleton } from '../ui/skeleton';

export default function CampaignRowSkeleton() {
  return (
    <article className='border-border/70 bg-card/80 group relative overflow-hidden rounded-lg border shadow-sm'>
      <div className='from-chart-1/70 to-chart-1/30 absolute top-0 left-0 h-full w-1 bg-gradient-to-b' />

      <div className='grid grid-cols-[1fr_auto] items-center gap-4 py-5.5 pr-4 pl-5 md:grid-cols-[minmax(180px,1.5fr)_repeat(3,100px)_minmax(120px,200px)_auto]'>
        <div className='min-w-0 space-y-1'>
          <Skeleton className='h-4 w-2/3' />
          <Skeleton className='h-3 w-1/3' />
        </div>

        <div className='hidden flex-col justify-end gap-1 md:flex'>
          <Skeleton className='h-2 w-10' />
          <Skeleton className='h-4 w-12' />
        </div>
        <div className='hidden flex-col justify-end gap-1 md:flex'>
          <Skeleton className='h-2 w-16' />
          <Skeleton className='h-4 w-10' />
        </div>
        <div className='hidden flex-col justify-end gap-1 md:flex'>
          <Skeleton className='h-2 w-20' />
          <Skeleton className='h-4 w-8' />
        </div>

        <div className='hidden h-11 md:block'>
          <Skeleton className='h-full w-full' />
        </div>

        <div className='flex items-center justify-end'>
          <Skeleton className='h-8 w-8 rounded-full' />
        </div>
      </div>
    </article>
  );
}
