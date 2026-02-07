'use client';

import { useMemo, useState } from 'react';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useImmediateTimeRange } from './hooks/useImmediateTimeRange';
import { QuickSelectSection } from '@/components/TimeRange/QuickSelectSection';
import { GranularitySection } from '@/components/TimeRange/GranularitySection';
import { DateRangeSection } from '@/components/TimeRange/DateRangeSection';
import { getAllowedGranularities, getVisibleGranularities } from '@/utils/granularityRanges';
import { formatPrimaryRangeLabel } from '@/utils/formatPrimaryRangeLabel';
import { LiveIndicator } from '@/components/live-indicator';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';

export function PrimaryRangePicker({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const t = useTranslations('components.timeRange');
  const locale = useLocale();
  const ctx = useTimeRangeContext();
  const actions = useImmediateTimeRange();
  const { isDemo } = useDashboardAuth();

  const allowed = getAllowedGranularities(ctx.startDate, ctx.endDate);
  const visible = getVisibleGranularities(ctx.startDate, ctx.endDate);

  const label = useMemo(
    () => () => {
      if (ctx.interval !== 'custom' && ctx.offset === 0) {
        return t(`presets.${ctx.interval}`);
      }
      return formatPrimaryRangeLabel({
        interval: ctx.interval,
        offset: ctx.offset,
        startDate: ctx.startDate,
        endDate: ctx.endDate,
        locale,
      });
    },
    [ctx.interval, ctx.offset, ctx.startDate, ctx.endDate, t, locale],
  );

  const titleText = `${ctx.startDate.toLocaleString()} - ${ctx.endDate.toLocaleString()}`;

  const content = (
    <div className='space-y-6 p-0 sm:p-0'>
      <QuickSelectSection
        selectedRange={ctx.interval}
        onRangeSelect={(v) => {
          if (v === 'custom') return;
          actions.setPresetRange(v);
          setOpen(false);
        }}
        allowedValues={isDemo ? ['24h', '7d'] : undefined}
      />
      <Separator className='my-1' />
      <DateRangeSection
        startDate={ctx.startDate}
        endDate={ctx.endDate}
        onDateRangeSelect={actions.setCustomRange}
      />
      <Separator className='my-1' />
      <GranularitySection
        selectedGranularity={ctx.granularity}
        allowedGranularities={allowed}
        visibleGranularities={visible}
        onGranularitySelect={actions.setGranularity}
        disabled={ctx.interval === 'realtime' || ctx.interval === '1h'}
        disabledTitle={t('granularityNotAvailable')}
      />
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
              'border-input dark:bg-input/30 dark:hover:bg-input/50 hover:bg-accent w-full min-w-0 cursor-pointer justify-between border bg-transparent shadow-xs transition-[color,box-shadow]',
              className,
            )}
            title={titleText}
          >
            <div className='flex min-w-0 flex-1 items-center gap-2'>
              <CalendarIcon className='h-4 w-4' />
              <span className='truncate'>{label()}</span>
              {ctx.interval === 'realtime' && <LiveIndicator className='relative top-auto right-auto' />}
            </div>
            <ChevronDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </DialogTrigger>
        <DialogContent className='bg-popover max-h-[85vh] w-[calc(100vw-2rem)] max-w-[350px] overflow-y-auto px-3 py-4'>
          <DialogHeader>
            <DialogTitle>{t('dateRange')}</DialogTitle>
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
          <div className='flex min-w-0 flex-1 items-center gap-2'>
            <CalendarIcon className='h-4 w-4' />
            <span className='truncate'>{label()}</span>
            {ctx.interval === 'realtime' && <LiveIndicator className='relative top-auto right-auto' />}
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
