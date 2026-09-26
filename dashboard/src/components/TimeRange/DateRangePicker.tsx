'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { addMonths, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { type DateRange } from 'react-day-picker';
import { useToggle } from '@/hooks/use-toggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslations } from 'next-intl';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { fromWallClock, toWallClock } from '@/utils/timezone';
import { PermissionGate } from '../tooltip/PermissionGate';

interface DateRangePickerProps {
  range: DateRange | undefined;
  onDateRangeSelect: (dateRange: DateRange | undefined) => void;
  id?: string;
  showSameLengthHint?: boolean;
}

export function DateRangePicker({ range, onDateRangeSelect, showSameLengthHint = false }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isMobile = useIsMobile();
  const t = useTranslations('components.timeRange');
  const { isDemo } = useDashboardAuth();

  const { timeZone } = useTimeRangeContext();

  const { isOn: selectStartDate, toggle: toggleDateSelect, setOff: setSelectEndDate } = useToggle(true);

  // The calendar works in browser-local days, so it gets the zone's wall clock and hands back zone instants
  const wallRange = useMemo<DateRange | undefined>(
    () =>
      range && {
        from: range.from && toWallClock(range.from, timeZone),
        to: range.to && toWallClock(range.to, timeZone),
      },
    [range, timeZone],
  );
  const todayWall = toWallClock(new Date(), timeZone);

  const handleDateSelect = useCallback(
    (selectedRange: DateRange | undefined) => {
      const emit = (next: DateRange | undefined) =>
        onDateRangeSelect(
          next && {
            from: next.from && fromWallClock(next.from, timeZone),
            to: next.to && fromWallClock(next.to, timeZone),
          },
        );

      if (!selectedRange) {
        emit(undefined);
        return;
      }

      const selected = getClickedDate(selectedRange, wallRange);

      if (!selected) {
        return emit(selectedRange);
      }

      const { newRange, setSelectEnd, shouldToggle } = computeSelectionRange(selected, wallRange, selectStartDate);

      emit(newRange);

      if (setSelectEnd) {
        setSelectEndDate();
        return;
      }

      if (shouldToggle) {
        toggleDateSelect();
      }
    },
    [wallRange, timeZone, onDateRangeSelect, selectStartDate, setSelectEndDate],
  );

  return (
    <div>
      <Popover open={isOpen} onOpenChange={(open) => (isDemo ? false : setIsOpen(open))}>
        <PopoverTrigger asChild>
          <span className='w-full'>
            <PermissionGate allowViewer>
              {(isDisabled) => (
                <Button
                  variant={'ghost'}
                  className={cn(
                    'h-8 w-full cursor-pointer justify-start truncate rounded-sm px-2 font-normal',
                    !range && 'text-muted-foreground',
                  )}
                  disabled={isDisabled}
                >
                  <span>{t('customPeriod')}</span>
                </Button>
              )}
            </PermissionGate>
          </span>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start' side={isMobile ? 'top' : 'bottom'}>
          <Calendar
            mode='range'
            selected={{
              from: wallRange?.from && startOfDay(wallRange.from),
              to: wallRange?.to && startOfDay(wallRange.to),
            }}
            startMonth={new Date(2019, 0)}
            endMonth={addMonths(todayWall, 1)}
            onSelect={handleDateSelect}
            captionLayout='dropdown'
            className='[&_button]:cursor-pointer [&_select]:cursor-pointer'
            disabled={(date) => date > todayWall}
            classNames={{
              dropdowns:
                'w-full flex flex-row-reverse items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5 rdp-dropdowns',
            }}
          />
          {showSameLengthHint && (
            <p className='text-muted-foreground pb-2 text-center text-xs'>{t('sameLengthAsMain')}</p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

type DateRangeResult = {
  newRange: DateRange;
  setSelectEnd: boolean;
  shouldToggle: boolean;
};

function normalize(date?: Date) {
  return date ? startOfDay(date).getTime() : undefined;
}

function getClickedDate(selectedRange: DateRange | undefined, range: DateRange | undefined) {
  if (!selectedRange) return undefined;

  // Since Calendar has it's own implementation of which date to select (start/end)
  // this code is used to figure out which date has just been selected by the user
  if (selectedRange.from && range?.from && normalize(range.from) !== normalize(selectedRange.from)) {
    return selectedRange.from;
  } else {
    return selectedRange.to;
  }
}

const computeSelectionRange = (
  selectedDate: Date,
  range: DateRange | undefined,
  selectStartDate: boolean,
): DateRangeResult => {
  const selectedTime = normalize(selectedDate)!;
  const fromTime = normalize(range?.from);
  const toTime = normalize(range?.to);

  if (selectStartDate) {
    if (toTime === undefined || selectedTime > toTime) {
      return { newRange: { from: selectedDate, to: undefined }, setSelectEnd: true, shouldToggle: false };
    }
    return { newRange: { from: selectedDate, to: range?.to }, setSelectEnd: false, shouldToggle: true };
  }

  if (fromTime === undefined || selectedTime < fromTime) {
    return { newRange: { from: selectedDate, to: undefined }, setSelectEnd: true, shouldToggle: false };
  }
  return { newRange: { from: range?.from, to: selectedDate }, setSelectEnd: false, shouldToggle: true };
};
