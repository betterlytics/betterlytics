import { Skeleton } from '@/components/ui/skeleton';
import { ReactNode } from 'react';
import { Card, CardContent } from '../ui/card';

type ChartSkeletonProps = {
  title?: ReactNode;
  titles?: string[];
  chartOnly?: boolean;
};

export default function ChartSkeleton({ title, titles, chartOnly }: ChartSkeletonProps) {
  if (chartOnly) {
    return (
      <div className='relative h-80 py-1 sm:px-2 md:px-4'>
        <Skeleton className='h-80 w-full' />
      </div>
    );
  }
  return (
    <Card className='px-3 pt-2 pb-4 sm:px-2 sm:pt-4 sm:pb-5'>
      <CardContent className='p-0'>
        {title && <div className='mb-5 p-0 sm:px-4'>{title}</div>}
        {titles && (
          <div className='mb-5 p-0 sm:px-4'>
            <div className='grid grid-cols-2 gap-1 lg:grid-cols-3 xl:grid-flow-col xl:grid-cols-none'>
              {titles.map((label) => (
                <div
                  key={label}
                  className='flex w-auto min-w-fit flex-col rounded-md px-2 py-4 pt-2 sm:flex-none sm:py-2 2xl:px-3'
                >
                  <span className='text-muted-foreground text-base/tight font-medium'>{label}</span>
                  <div className='mt-1 flex items-center gap-2'>
                    <Skeleton className='h-7 w-full' />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className='relative h-80 py-1 sm:px-2 md:px-4'>
          <Skeleton className='h-80 w-full' />
        </div>
      </CardContent>
    </Card>
  );
}
