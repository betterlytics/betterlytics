'use client';

import { useCallback } from 'react';
import {
  differenceInCalendarDays,
  endOfDay,
  startOfDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  startOfYear,
  endOfYear,
  addYears,
  subYears,
  addDays,
} from 'date-fns';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import {
  TimeRangeValue,
  getDateRangeForTimePresets,
  getStartDateWithGranularity,
  getEndDateWithGranularity,
  getDateWithTimeOfDay,
} from '@/utils/timeRanges';
import {
  GranularityRangeValues,
  getAllowedGranularities,
  getValidGranularityFallback,
} from '@/utils/granularityRanges';

export function useImmediateTimeRange() {
  const ctx = useTimeRangeContext();

  const computeShiftedRange = useCallback(
    (direction: 'previous' | 'next') => {
      const interval = ctx.interval;
      let rawStart = ctx.startDate;
      let rawEnd = ctx.endDate;

      if (interval === 'mtd') {
        const currentMonthStart = startOfMonth(ctx.startDate);
        const targetStart =
          direction === 'previous'
            ? startOfMonth(subMonths(currentMonthStart, 1))
            : startOfMonth(addMonths(currentMonthStart, 1));

        if (direction === 'next') {
          const todayMonthStart = startOfMonth(new Date());
          if (targetStart.getTime() > todayMonthStart.getTime()) {
            return null; // would navigate into a future MTD
          }
        }

        const targetMonthDays = endOfMonth(targetStart).getDate();
        const endDay = ctx.endDate.getDate();
        const targetEndDay = Math.min(endDay, targetMonthDays);
        rawStart = targetStart;
        rawEnd = getDateWithTimeOfDay(
          new Date(targetStart.getFullYear(), targetStart.getMonth(), targetEndDay),
          ctx.endDate,
        );
      } else if (interval === 'ytd') {
        const yearStart = startOfYear(ctx.startDate);
        const targetStart =
          direction === 'previous' ? startOfYear(subYears(yearStart, 1)) : startOfYear(addYears(yearStart, 1));
        const offsetDays = differenceInCalendarDays(ctx.endDate, yearStart);
        const targetYearEnd = endOfYear(targetStart);
        let candidateEnd = getDateWithTimeOfDay(addDays(targetStart, offsetDays), ctx.endDate);
        if (candidateEnd.getTime() > targetYearEnd.getTime()) candidateEnd = targetYearEnd;
        rawStart = targetStart;
        rawEnd = candidateEnd;
      } else if (interval === 'last_month') {
        const monthStart = startOfMonth(ctx.startDate);
        const targetStart =
          direction === 'previous'
            ? startOfMonth(subMonths(monthStart, 1))
            : startOfMonth(addMonths(monthStart, 1));
        rawStart = targetStart;
        rawEnd = endOfMonth(targetStart);
      } else {
        const delta = ctx.endDate.getTime() - ctx.startDate.getTime();
        rawStart = new Date(ctx.startDate.getTime() + (direction === 'previous' ? -delta : delta));
        rawEnd = new Date(ctx.endDate.getTime() + (direction === 'previous' ? -delta : delta));
      }

      if (direction === 'next') {
        // Prevent navigating into a future period beyond the current day
        const todayEnd = endOfDay(new Date());
        if (rawEnd.getTime() > todayEnd.getTime()) {
          return null;
        }
      }

      return { rawStart, rawEnd } as const;
    },
    [ctx],
  );

  const setPresetRange = useCallback(
    (preset: Exclude<TimeRangeValue, 'custom'>) => {
      const { startDate, endDate } = getDateRangeForTimePresets(preset);
      const allowed = getAllowedGranularities(startDate, endDate);
      const nextGranularity = getValidGranularityFallback(ctx.granularity, allowed);
      const alignedStart = getStartDateWithGranularity(startDate, nextGranularity);
      const alignedEnd = getEndDateWithGranularity(endDate, nextGranularity);
      ctx.setPeriod(alignedStart, alignedEnd);
      ctx.setOffset(0);
      if (ctx.interval !== preset) ctx.setInterval(preset);

      if (preset === 'realtime' || preset === '1h') {
        ctx.setGranularity('minute_1');
      } else {
        if (ctx.granularity !== nextGranularity) ctx.setGranularity(nextGranularity);
      }
    },
    [ctx],
  );

  const setCustomRange = useCallback(
    (from?: Date, to?: Date) => {
      if (!from || !to) return;
      const startDate = startOfDay(from);
      const endDate = endOfDay(to);
      const allowed = getAllowedGranularities(startDate, endDate);
      const nextGranularity = getValidGranularityFallback(ctx.granularity, allowed);
      const alignedStart = getStartDateWithGranularity(startDate, nextGranularity);
      const alignedEnd = getEndDateWithGranularity(endDate, nextGranularity);
      ctx.setPeriod(alignedStart, alignedEnd);
      ctx.setInterval('custom');
      ctx.setOffset(0);
      if (ctx.granularity !== nextGranularity) ctx.setGranularity(nextGranularity);
    },
    [ctx],
  );

  const setGranularity = useCallback(
    (g: GranularityRangeValues) => {
      const allowed = getAllowedGranularities(ctx.startDate, ctx.endDate);
      if (!allowed.includes(g)) return;
      const alignedStart = getStartDateWithGranularity(ctx.startDate, g);
      const alignedEnd = getEndDateWithGranularity(ctx.endDate, g);
      if (alignedStart.getTime() !== ctx.startDate.getTime() || alignedEnd.getTime() !== ctx.endDate.getTime()) {
        ctx.setPeriod(alignedStart, alignedEnd);
      }
      ctx.setGranularity(g);
    },
    [ctx],
  );

  const enableCompare = useCallback(
    (enable: boolean) => {
      if (!enable) {
        ctx.setCompareMode('off');
        return;
      }
      ctx.setCompareMode('previous');
    },
    [ctx],
  );

  const setComparePreset = useCallback(
    (preset: 'previous' | 'year' | 'custom') => {
      ctx.setCompareMode(preset);
    },
    [ctx],
  );

  const setCompareCustomStart = useCallback(
    (customStart?: Date) => {
      if (!customStart) return;
      ctx.setCompareMode('custom');
      const days = differenceInCalendarDays(ctx.endDate, ctx.startDate) + 1;
      const start = startOfDay(customStart);
      const end = endOfDay(new Date(start.getTime() + (days - 1) * 86400000));
      ctx.setCompareDateRange(start, end);
    },
    [ctx],
  );

  const shiftPreviousPeriod = useCallback(() => {
    const computed = computeShiftedRange('previous');
    if (!computed) return;
    const { rawStart, rawEnd } = computed;

    if (ctx.interval !== 'custom') {
      ctx.setOffset((offset) => offset - 1);
    }

    const allowed = getAllowedGranularities(rawStart, rawEnd);
    const nextGranularity = getValidGranularityFallback(ctx.granularity, allowed);
    const alignedStart = getStartDateWithGranularity(rawStart, nextGranularity);
    const alignedEnd = getEndDateWithGranularity(rawEnd, nextGranularity);
    ctx.setPeriod(alignedStart, alignedEnd);
    if (ctx.granularity !== nextGranularity) ctx.setGranularity(nextGranularity);
  }, [computeShiftedRange, ctx]);

  const shiftNextPeriod = useCallback(() => {
    const computed = computeShiftedRange('next');
    if (!computed) return;
    const { rawStart, rawEnd } = computed;

    if (ctx.interval !== 'custom') {
      ctx.setOffset((offset) => offset + 1);
    }

    const allowed = getAllowedGranularities(rawStart, rawEnd);
    const nextGranularity = getValidGranularityFallback(ctx.granularity, allowed);
    const alignedStart = getStartDateWithGranularity(rawStart, nextGranularity);
    const alignedEnd = getEndDateWithGranularity(rawEnd, nextGranularity);
    ctx.setPeriod(alignedStart, alignedEnd);
    if (ctx.granularity !== nextGranularity) ctx.setGranularity(nextGranularity);
  }, [computeShiftedRange, ctx]);

  const canShiftNextPeriod = useCallback(() => {
    return computeShiftedRange('next') !== null;
  }, [computeShiftedRange]);

  return {
    setPresetRange,
    setCustomRange,
    setGranularity,
    enableCompare,
    setComparePreset,
    setCompareCustomStart,
    shiftPreviousPeriod,
    shiftNextPeriod,
    canShiftNextPeriod,
  };
}
