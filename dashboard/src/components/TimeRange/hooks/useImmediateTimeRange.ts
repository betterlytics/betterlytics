'use client';

import { useCallback } from 'react';
import { differenceInCalendarDays, endOfDay, startOfDay } from 'date-fns';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { TimeRangeValue, getDateRangeForTimePresets } from '@/utils/timeRanges';
import {
  GranularityRangeValues,
  getAllowedGranularities,
  getValidGranularityFallback,
} from '@/utils/granularityRanges';

export function useImmediateTimeRange() {
  const ctx = useTimeRangeContext();

  const setPresetRange = useCallback(
    (preset: Exclude<TimeRangeValue, 'custom'>) => {
      const { startDate, endDate } = getDateRangeForTimePresets(preset);
      const s = startOfDay(startDate);
      const e = endOfDay(endDate);
      const allowed = getAllowedGranularities(s, e);
      const nextGranularity = getValidGranularityFallback(ctx.granularity, allowed);
      ctx.setPeriod(s, e);
      if (ctx.granularity !== nextGranularity) ctx.setGranularity(nextGranularity);
    },
    [ctx],
  );

  const setCustomRange = useCallback(
    (from?: Date, to?: Date) => {
      if (!from || !to) return;
      const s = startOfDay(from);
      const e = endOfDay(to);
      const allowed = getAllowedGranularities(s, e);
      const nextGranularity = getValidGranularityFallback(ctx.granularity, allowed);
      ctx.setPeriod(s, e);
      if (ctx.granularity !== nextGranularity) ctx.setGranularity(nextGranularity);
    },
    [ctx],
  );

  const setGranularity = useCallback(
    (g: GranularityRangeValues) => {
      const allowed = getAllowedGranularities(ctx.startDate, ctx.endDate);
      if (!allowed.includes(g)) return;
      ctx.setGranularity(g);
    },
    [ctx],
  );

  const enableCompare = useCallback(
    (enable: boolean) => {
      ctx.setCompareEnabled(enable);
      if (!enable) return;
      const days = differenceInCalendarDays(ctx.endDate, ctx.startDate) + 1;
      const prevEnd = endOfDay(new Date(ctx.startDate.getTime() - 1));
      const prevStart = startOfDay(new Date(prevEnd.getTime() - (days - 1) * 86400000));
      ctx.setCompareDateRange(prevStart, prevEnd);
    },
    [ctx],
  );

  const setComparePreset = useCallback(
    (preset: 'previous_period' | 'previous_year') => {
      const days = differenceInCalendarDays(ctx.endDate, ctx.startDate) + 1;
      if (preset === 'previous_period') {
        const prevEnd = endOfDay(new Date(ctx.startDate.getTime() - 1));
        const prevStart = startOfDay(new Date(prevEnd.getTime() - (days - 1) * 86400000));
        ctx.setCompareDateRange(prevStart, prevEnd);
      } else {
        const start = new Date(ctx.startDate);
        start.setFullYear(start.getFullYear() - 1);
        const end = new Date(start);
        end.setDate(start.getDate() + (days - 1));
        ctx.setCompareDateRange(startOfDay(start), endOfDay(end));
      }
    },
    [ctx],
  );

  const setCompareCustomStart = useCallback(
    (customStart?: Date) => {
      if (!customStart) return;
      const days = differenceInCalendarDays(ctx.endDate, ctx.startDate) + 1;
      const start = startOfDay(customStart);
      const end = endOfDay(new Date(start.getTime() + (days - 1) * 86400000));
      ctx.setCompareDateRange(start, end);
    },
    [ctx],
  );

  return {
    setPresetRange,
    setCustomRange,
    setGranularity,
    enableCompare,
    setComparePreset,
    setCompareCustomStart,
  };
}


