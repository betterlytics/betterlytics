import { Skeleton } from '@/components/ui/skeleton';

type SummaryCardsSkeletonProps = {
  count?: number;
};

export default function SummaryCardsSkeleton({ count = 4 }: SummaryCardsSkeletonProps) {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className='bg-card rounded-xl border p-4'>
          <Skeleton className='mb-6 h-3 w-1/2' />
          <Skeleton className='h-5 w-1/4' />
        </div>
      ))}
    </div>
  );
}
