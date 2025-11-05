'use client';

import { useCallback } from 'react';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { TimeRangeValue } from '@/utils/timeRanges';
import { GranularityRangeValues, getAllowedGranularities } from '@/utils/granularityRanges';
import { baEvent } from '@/lib/ba-event';
import { getResolvedRanges } from '@/lib/ba-timerange';

export function useImmediateTimeRange() {
  const ctx = useTimeRangeContext();

  const computeShiftedRange = useCallback(
    (offset: number) => {
      const resolved = getResolvedRanges(
        ctx.interval,
        ctx.compareMode,
        ctx.timeZone,
        ctx.startDate,
        ctx.endDate,
        ctx.granularity,
        ctx.compareStartDate,
        ctx.compareEndDate,
        ctx.offset + offset,
        ctx.compareAlignWeekdays,
      );

      if (resolved.main.start.getTime() > Date.now()) {
        return null;
      }
      return resolved;
    },
    [ctx],
  );

  const setPresetRange = useCallback(
    (preset: Exclude<TimeRangeValue, 'custom'>) => {
      const resolved = getResolvedRanges(
        preset,
        ctx.compareMode,
        ctx.timeZone,
        ctx.startDate,
        ctx.endDate,
        ctx.granularity,
        ctx.compareStartDate,
        ctx.compareEndDate,
        0,
        ctx.compareAlignWeekdays,
      );

      ctx.setPeriod(resolved.main.start, resolved.main.end);
      ctx.setOffset(0);
      if (ctx.interval !== preset) ctx.setInterval(preset);
      if (ctx.granularity !== resolved.granularity) ctx.setGranularity(resolved.granularity);
      baEvent('set-preset-date-range', {
        interval: preset,
      });
    },
    [ctx],
  );

  const setCustomRange = useCallback(
    (from?: Date, to?: Date) => {
      if (!from || !to) return;
      const resolved = getResolvedRanges(
        'custom',
        ctx.compareMode,
        ctx.timeZone,
        from,
        to,
        ctx.granularity,
        ctx.compareStartDate,
        ctx.compareEndDate,
        0,
        ctx.compareAlignWeekdays,
      );
      ctx.setPeriod(resolved.main.start, resolved.main.end);
      ctx.setInterval('custom');
      ctx.setOffset(0);
      ctx.setGranularity(resolved.granularity);

      baEvent('set-custom-date-range', {
        from,
        to,
      });
    },
    [ctx],
  );

  const setGranularity = useCallback(
    (g: GranularityRangeValues) => {
      const allowed = getAllowedGranularities(ctx.startDate, ctx.endDate);
      if (!allowed.includes(g)) return;
      const resolved = getResolvedRanges(
        ctx.interval,
        ctx.compareMode,
        ctx.timeZone,
        ctx.startDate,
        ctx.endDate,
        g,
        ctx.compareStartDate,
        ctx.compareEndDate,
        0,
        ctx.compareAlignWeekdays,
      );
      ctx.setPeriod(resolved.main.start, resolved.main.end);
      baEvent('set-granularity', {
        granularity: g,
      });
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

      baEvent('set-preset-compare', {
        preset: 'off',
      });
    },
    [ctx],
  );

  const setComparePreset = useCallback(
    (preset: 'previous' | 'year' | 'custom') => {
      ctx.setCompareMode(preset);
      baEvent('set-preset-compare', {
        preset,
      });
    },
    [ctx],
  );

  const setCompareCustomStart = useCallback(
    (customStart?: Date) => {
      if (!customStart) return;
      ctx.setCompareMode('custom');
      const resolved = getResolvedRanges(
        'custom',
        ctx.compareMode,
        ctx.timeZone,
        customStart,
        ctx.endDate,
        ctx.granularity,
        ctx.compareStartDate,
        ctx.compareEndDate,
        0,
        ctx.compareAlignWeekdays,
      );
      ctx.setCompareDateRange(resolved.compare?.start ?? customStart, resolved.compare?.end ?? customStart);
    },
    [ctx],
  );

  const shiftPreviousPeriod = useCallback(() => {
    const computed = computeShiftedRange(-1);
    if (!computed) return;
    const { start, end } = computed.main;

    if (ctx.interval !== 'custom') {
      ctx.setOffset((offset) => offset - 1);
    }

    ctx.setPeriod(start, end);
    if (ctx.granularity !== computed.granularity) ctx.setGranularity(computed.granularity);

    baEvent('shift-period', {
      direction: 'previous',
    });
  }, [computeShiftedRange, ctx]);

  const shiftNextPeriod = useCallback(() => {
    const computed = computeShiftedRange(1);
    if (!computed) return;
    const { start, end } = computed.main;

    if (ctx.interval !== 'custom') {
      ctx.setOffset((offset) => offset + 1);
    }

    ctx.setPeriod(start, end);
    if (ctx.granularity !== computed.granularity) ctx.setGranularity(computed.granularity);
    baEvent('shift-period', {
      direction: 'next',
    });
  }, [computeShiftedRange, ctx]);

  const canShiftNextPeriod = useCallback(() => {
    return computeShiftedRange(1) !== null;
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
    setCompareAlignWeekdays: ctx.setCompareAlignWeekdays,
  };
}
