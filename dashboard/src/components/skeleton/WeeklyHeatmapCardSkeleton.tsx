import { Fragment } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger } from '@/components/ui/select';

type WeeklyHeatmapCardSkeletonProps = {
  title: string;
  initialMetricLabel: string;
};

export function WeeklyHeatmapCardSkeleton({ title, initialMetricLabel }: WeeklyHeatmapCardSkeletonProps) {
  return (
    <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:p-6 sm:pt-4 sm:pb-4'>
      <CardHeader className='px-0 pb-1'>
        <div className='flex flex-row items-center justify-between gap-2'>
          <CardTitle className='text-base font-medium whitespace-nowrap'>{title}</CardTitle>
          <div className='pointer-events-none w-40 sm:w-48'>
            <Select>
              <SelectTrigger size='sm' className='w-full overflow-hidden'>
                <span className='text-muted-foreground block truncate'>{initialMetricLabel}</span>
              </SelectTrigger>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className='flex flex-1 flex-col px-0'>
        <div className='grid grid-cols-[40px_repeat(7,1fr)] gap-x-0.5 gap-y-1 pb-3'>
          <div />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={`day-${i}`} className='mx-auto mb-1 h-3 w-10 rounded' />
          ))}
          {Array.from({ length: 24 }).map((_, hourIndex) => (
            <Fragment key={`row-${hourIndex}`}>
              <div className='flex h-2.5 items-center justify-end pr-2'>
                {hourIndex % 3 === 1 ? <Skeleton className='h-2 w-6 rounded' /> : null}
              </div>
              {Array.from({ length: 7 }).map((_, dayIndex) => (
                <Skeleton key={`cell-${hourIndex}-${dayIndex}`} className='h-2.5 w-full rounded-sm' />
              ))}
            </Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
