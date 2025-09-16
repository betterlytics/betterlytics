'use client';

import { useCallback } from 'react';
import { differenceInCalendarDays, endOfDay, startOfDay } from 'date-fns';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import {
  TimeRangeValue,
  getDateRangeForTimePresets,
  getCompareRangeForPreset,
  ComparePreset,
} from '@/utils/timeRanges';
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
      const { startDate, endDate } = getCompareRangeForPreset(ctx.startDate, ctx.endDate, 'previous_period');
      ctx.setCompareDateRange(startDate, endDate);
    },
    [ctx],
  );

  const setComparePreset = useCallback(
    (preset: ComparePreset) => {
      const { startDate, endDate } = getCompareRangeForPreset(ctx.startDate, ctx.endDate, preset);
      ctx.setCompareDateRange(startDate, endDate);
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
