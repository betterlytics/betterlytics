'use client';

import { PrimaryRangePicker } from './PrimaryRangePicker';
import { CompareRangePicker } from './CompareRangePicker';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useImmediateTimeRange } from './hooks/useImmediateTimeRange';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { cn } from '@/lib/utils';

export function TimeRangeToolbar({ showComparison = true }: { showComparison?: boolean }) {
  const actions = useImmediateTimeRange();
  const ctx = useTimeRangeContext();
  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      <div className='flex items-center gap-0'>
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
          disabled={ctx.interval === 'realtime'}
        >
          <ChevronRightIcon className='h-4 w-4' />
        </Button>
      </div>
      <PrimaryRangePicker />
      {showComparison && (
        <>
          <span className='text-muted-foreground px-1 text-sm select-none'>vs</span>
          <CompareRangePicker className={cn(ctx.compareMode === 'off' ? 'opacity-80' : '')} />
        </>
      )}
    </div>
  );
}
