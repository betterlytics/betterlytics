'use client';

import { useState } from 'react';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useImmediateTimeRange } from './hooks/useImmediateTimeRange';
import { DateRangeSection } from '@/components/TimeRangeSelector/DateRangeSection';

export function CompareRangePicker({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const t = useTranslations('components.timeRange');
  const ctx = useTimeRangeContext();
  const actions = useImmediateTimeRange();

  const label = () => {
    if (ctx.compareMode === 'off' || !ctx.compareStartDate || !ctx.compareEndDate) return 'Disabled';
    return `${ctx.compareStartDate.toLocaleDateString()} - ${ctx.compareEndDate.toLocaleDateString()}`;
  };

  const content = (
    <div className='space-y-6 p-0 sm:p-0'>
      <div className='grid gap-2'>
        <Button
          variant={ctx.compareMode === 'off' ? 'default' : 'outline'}
          className='cursor-pointer'
          aria-pressed={ctx.compareMode === 'off'}
          onClick={() => actions.enableCompare(ctx.compareMode === 'off')}
        >
          Disable compare
        </Button>
        <Button
          variant={ctx.compareMode === 'previous' ? 'default' : 'outline'}
          onClick={() => actions.setComparePreset('previous')}
          className='cursor-pointer'
        >
          Previous period
        </Button>
        <Button
          variant={ctx.compareMode === 'year' ? 'default' : 'outline'}
          onClick={() => actions.setComparePreset('year')}
          className='cursor-pointer'
        >
          Previous year
        </Button>
      </div>
      <Separator className='my-2' />
      <div className='space-y-2'>
        <div className='text-sm font-medium'>{t('compareToPeriod')}</div>
        <DateRangeSection
          startDate={ctx.compareStartDate}
          endDate={ctx.compareEndDate}
          onDateRangeSelect={(from) => actions.setCompareCustomStart(from)}
        />
        <p className='text-muted-foreground text-xs'>Same length as main range</p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant='secondary'
            role='combobox'
            className={cn(
              'border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent min-w-[200px] cursor-pointer justify-between border bg-transparent shadow-xs transition-[color,box-shadow]',
              className,
            )}
          >
            <div className='flex items-center gap-2'>
              <CalendarIcon className='h-4 w-4' />
              <span>{label()}</span>
            </div>
            <ChevronDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </DialogTrigger>
        <DialogContent className='bg-popover max-h-[85vh] w-[calc(100vw-2rem)] max-w-[420px] overflow-y-auto px-3 py-4'>
          <DialogHeader>
            <DialogTitle>{t('compareToPeriod')}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='secondary'
          role='combobox'
          className={cn(
            'border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent min-w-[200px] cursor-pointer justify-between border bg-transparent shadow-xs transition-[color,box-shadow]',
            className,
          )}
        >
          <div className='flex items-center gap-2'>
            <CalendarIcon className='h-4 w-4' />
            <span>{label()}</span>
          </div>
          <ChevronDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[350px] max-w-[calc(100svw-48px)] space-y-6 border p-6 shadow-2xl' align='end'>
        {content}
      </PopoverContent>
    </Popover>
  );
}
