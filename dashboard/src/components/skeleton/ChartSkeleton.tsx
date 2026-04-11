import { Skeleton } from '@/components/ui/skeleton';
import { ReactNode } from 'react';
import { Card, CardContent } from '../ui/card';

type ChartSkeletonProps = {
  title?: ReactNode;
};

export default function ChartSkeleton({ title }: ChartSkeletonProps) {
  return (
    <Card className='px-3 pt-2 pb-4 sm:px-2 sm:pt-4 sm:pb-5'>
      <CardContent className='p-0'>
        {title && <div className='mb-5 p-0 sm:px-4'>{title}</div>}
        <div className='relative h-80 py-1 sm:px-2 md:px-4'>
          <Skeleton className='h-80 w-full' />
        </div>
      </CardContent>
    </Card>
  );
}
