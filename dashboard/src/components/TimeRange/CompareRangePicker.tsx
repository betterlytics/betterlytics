'use client';

import { useState } from 'react';
import { CalendarIcon, ChevronDownIcon, ScaleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useImmediateTimeRange } from './hooks/useImmediateTimeRange';
import { isDerivedCompareMode } from '@/utils/compareRanges';
import { DateRangeSection } from '@/components/TimeRangeSelector/DateRangeSection';

export function CompareRangePicker({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const t = useTranslations('components.timeRange');
  const ctx = useTimeRangeContext();
  const actions = useImmediateTimeRange();

  const label = () => {
    if (ctx.compareMode === 'off' || !ctx.compareStartDate || !ctx.compareEndDate) return 'Disabled';
    if (isDerivedCompareMode(ctx.compareMode)) {
      return ctx.compareMode === 'previous' ? 'Previous period' : 'Previous year';
    }
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${ctx.compareStartDate.toLocaleDateString(undefined, opts)} - ${ctx.compareEndDate.toLocaleDateString(
      undefined,
      opts,
    )}`;
  };

  const titleText =
    ctx.compareMode === 'off' || !ctx.compareStartDate || !ctx.compareEndDate
      ? 'Disabled'
      : `${ctx.compareStartDate.toLocaleString()} - ${ctx.compareEndDate.toLocaleString()}`;

  const content = (
    <div className='space-y-6 p-0 sm:p-0'>
      <div className='m-0 grid gap-2'>
        <Button
          variant={ctx.compareMode === 'off' ? 'default' : 'ghost'}
          className='h-8 w-full cursor-pointer justify-start rounded-sm px-2'
          aria-pressed={ctx.compareMode === 'off'}
          onClick={() => {
            actions.enableCompare(ctx.compareMode === 'off');
            setOpen(false);
          }}
        >
          Disable compare
        </Button>
        <Button
          variant={ctx.compareMode === 'previous' ? 'default' : 'ghost'}
          onClick={() => {
            actions.setComparePreset('previous');
            setOpen(false);
          }}
          className='h-8 w-full cursor-pointer justify-start rounded-sm px-2'
        >
          Previous period
        </Button>
        <Button
          variant={ctx.compareMode === 'year' ? 'default' : 'ghost'}
          onClick={() => {
            actions.setComparePreset('year');
            setOpen(false);
          }}
          className='h-8 w-full cursor-pointer justify-start rounded-sm px-2'
        >
          Previous year
        </Button>
        <DateRangeSection
          startDate={ctx.compareStartDate}
          endDate={ctx.compareEndDate}
          onDateRangeSelect={(from) => {
            actions.setCompareCustomStart(from);
            setOpen(false);
          }}
          showSameLengthHint
        />
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
            title={titleText}
          >
            <div className='flex items-center gap-2'>
              <ScaleIcon className='h-4 w-4' />
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
          title={titleText}
        >
          <div className='flex items-center gap-2'>
            <ScaleIcon className='h-4 w-4' />
            <span>{label()}</span>
          </div>
          <ChevronDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] max-w-[calc(100svw-48px)] space-y-6 border p-1 shadow-2xl' align='end'>
        {content}
      </PopoverContent>
    </Popover>
  );
}
