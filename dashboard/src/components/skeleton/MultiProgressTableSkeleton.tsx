import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactNode } from 'react';

type MultiProgressTableSkeletonProps = {
  title: string;
  tabs: string[];
  footer?: ReactNode;
  rows?: number;
};

export default function MultiProgressTableSkeleton({
  title,
  tabs,
  footer,
  rows = 5,
}: MultiProgressTableSkeletonProps) {
  return (
    <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:p-6 sm:pt-4 sm:pb-4'>
      <CardHeader className='px-0 pb-0'>
        <div className='flex flex-col justify-between space-y-1 px-0 pb-1 sm:flex-row lg:flex-col xl:flex-row xl:items-center'>
          <CardTitle className='flex-1 text-base font-medium'>{title}</CardTitle>
          <div className='flex h-8 items-center sm:items-end'>
            <div
              className={`bg-secondary dark:inset-shadow-background grid w-full gap-1 overflow-hidden rounded-md px-1 inset-shadow-sm`}
              style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
            >
              {tabs.map((tab) => (
                <span
                  key={tab}
                  className='text-muted-foreground px-3 py-1 text-center text-xs font-medium'
                >
                  {tab}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col px-0'>
        <div className='space-y-2 pt-2'>
          {Array.from({ length: rows }, (_, i) => (
            <Skeleton key={i} className='h-4 w-full' />
          ))}
        </div>
      </CardContent>
      {footer && (
        <CardFooter className='justify-end px-0 pt-2'>
          <div className='w-full border-t pt-2 text-right'>{footer}</div>
        </CardFooter>
      )}
    </Card>
  );
}
