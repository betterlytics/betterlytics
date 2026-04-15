import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReactNode } from 'react';

const ROW_WIDTHS = [100, 78, 61, 47, 35, 26, 19, 14, 10, 7];

export default function MultiProgressTableRowSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className='space-y-2'>
      {Array.from({ length: rows }, (_, i) => {
        const width = ROW_WIDTHS[Math.min(i, ROW_WIDTHS.length - 1)];
        return (
          <div key={i} className='relative h-7'>
            <Skeleton className='absolute inset-y-0 left-0 rounded-sm' style={{ width: `${width}%` }} />
            <div className='absolute inset-y-0 right-3 flex items-center'>
              <Skeleton className='h-3 w-5 rounded' />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type MultiProgressTableCardSkeletonProps = {
  title: string;
  tabs: string[];
  footer?: ReactNode;
  rows?: number;
};

export function MultiProgressTableCardSkeleton({
  title,
  tabs,
  footer,
  rows = 10,
}: MultiProgressTableCardSkeletonProps) {
  return (
    <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:p-6 sm:pt-4 sm:pb-4'>
      <CardHeader className='px-0 pb-0'>
        <div className='flex flex-col justify-between space-y-1 px-0 pb-1 sm:flex-row lg:flex-col xl:flex-row xl:items-center'>
          <CardTitle className='flex-1 text-base font-medium'>{title}</CardTitle>
          <Tabs defaultValue={tabs[0]} className='flex h-8 items-center sm:items-end'>
            <TabsList
              className={`grid grid-cols-${tabs.length} bg-secondary dark:inset-shadow-background relative w-full gap-1 overflow-hidden px-1 inset-shadow-sm`}
            >
              <div
                className='border-border dark:border-input bg-background dark:bg-input/30 pointer-events-none absolute top-[3px] bottom-[3px] left-[4px] z-0 rounded-sm border shadow-sm'
                style={{ width: `calc((100% - 8px - ${(tabs.length - 1) * 4}px) / ${tabs.length})` }}
              />
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className='hover:bg-accent/50 hover:text-foreground text-muted-foreground data-[state=active]:text-foreground relative z-10 cursor-pointer rounded-sm border border-transparent bg-transparent px-3 py-1 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent'
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col px-0'>
        <div className='h-[22rem]'>
          <MultiProgressTableRowSkeleton rows={rows} />
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
