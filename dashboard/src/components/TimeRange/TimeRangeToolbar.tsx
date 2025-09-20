'use client';

import { PrimaryRangePicker } from './PrimaryRangePicker';
import { CompareRangePicker } from './CompareRangePicker';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useImmediateTimeRange } from './hooks/useImmediateTimeRange';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export function TimeRangeToolbar({ showComparison = true }: { showComparison?: boolean }) {
  const actions = useImmediateTimeRange();
  const ctx = useTimeRangeContext();
  const isMobile = useIsMobile();
  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center'>
      {isMobile ? (
        <>
          <div className='order-1 grid grid-cols-1 gap-2'>
            <div className='flex w-full items-center gap-2'>
              <PrimaryRangePicker className='min-w-0 flex-1' />
              {showComparison && (
                <>
                  <span className='sr-only'>Compare</span>
                  <CompareRangePicker
                    className={cn(ctx.compareMode === 'off' ? 'opacity-80' : '', 'min-w-0 flex-1')}
                  />
                </>
              )}
            </div>
          </div>
          <div className='order-2 grid grid-cols-2 gap-2'>
            <Button
              variant='secondary'
              aria-label='Previous period'
              title='Previous period'
              className='border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent h-8 w-full cursor-pointer items-center justify-center gap-2 border bg-transparent shadow-xs transition-[color,box-shadow]'
              onClick={actions.shiftPreviousPeriod}
              disabled={ctx.interval === 'realtime'}
            >
              <ChevronLeftIcon className='h-4 w-4' />
              <span className='text-sm'>Previous period</span>
            </Button>
            <Button
              variant='secondary'
              aria-label='Next period'
              title='Next period'
              className='border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent h-8 w-full cursor-pointer items-center justify-center gap-2 border bg-transparent shadow-xs transition-[color,box-shadow]'
              onClick={actions.shiftNextPeriod}
              disabled={ctx.interval === 'realtime' || !actions.canShiftNextPeriod()}
            >
              <span className='text-sm'>Next period</span>
              <ChevronRightIcon className='h-4 w-4' />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className='flex items-center gap-0 self-start sm:mr-1'>
            <Button
              variant='ghost'
              size='icon'
              aria-label='Previous period'
              title='Previous period'
              className='h-8 w-7 cursor-pointer p-0'
              onClick={actions.shiftPreviousPeriod}
              disabled={ctx.interval === 'realtime'}
            >
              <ChevronLeftIcon className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              aria-label='Next period'
              title='Next period'
              className='h-8 w-7 cursor-pointer p-0'
              onClick={actions.shiftNextPeriod}
              disabled={ctx.interval === 'realtime' || !actions.canShiftNextPeriod()}
            >
              <ChevronRightIcon className='h-4 w-4' />
            </Button>
          </div>
          <PrimaryRangePicker />
          {showComparison && (
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground px-1 text-sm select-none'>vs</span>
              <CompareRangePicker className={cn(ctx.compareMode === 'off' ? 'opacity-80' : '')} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
