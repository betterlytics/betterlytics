import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '../ui/card';

type SummaryCardsSkeletonProps = {
  titles?: string[];
};

export default function SummaryCardsSkeleton({ titles }: SummaryCardsSkeletonProps) {
  return (
    <div className='grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {Array.from({ length: titles?.length || 4 }, (_, i) => (
        <Card className='relative overflow-hidden rounded-xl py-0'>
          <CardContent className='relative z-10 flex h-full flex-col justify-between space-y-0 px-3 py-3 pb-4 sm:px-6 sm:pt-3 sm:pb-3'>
            <div className='mb-1 flex items-center justify-between'>
              {titles?.[i] ? (
                <span className='text-foreground text-sm font-medium hyphens-auto lg:text-base'>{titles[i]}</span>
              ) : (
                <Skeleton className='h-3 w-1/2' />
              )}
            </div>
            <Skeleton className='my-2.5 h-3 w-1/2' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
