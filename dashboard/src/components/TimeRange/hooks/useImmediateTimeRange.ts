'use client';

import { useCallback } from 'react';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { TimeRangeValue } from '@/utils/timeRanges';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { baEvent } from '@/lib/ba-event';
import { isNowInFirstBucket, getResolvedRanges } from '@/lib/ba-timerange';

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

      if (resolved.main.start.getTime() >= Date.now() || isNowInFirstBucket(resolved, ctx.timeZone)) {
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
      ctx.setInterval(preset);
      ctx.setGranularity(resolved.granularity);

      if (ctx.compareMode === 'custom') {
        ctx.setCompareDateRange(resolved.compare?.start, resolved.compare?.end);
      }

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
      ctx.setOffset(0);
      ctx.setInterval('custom');
      ctx.setGranularity(resolved.granularity);

      if (ctx.compareMode === 'custom') {
        ctx.setCompareDateRange(resolved.compare?.start, resolved.compare?.end);
      }

      baEvent('set-custom-date-range', {
        from,
        to,
      });
    },
    [ctx],
  );

  const setGranularity = useCallback(
    (g: GranularityRangeValues) => {
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
      ctx.setGranularity(resolved.granularity);
      baEvent('set-granularity', {
        granularity: resolved.granularity,
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
        ctx.startDate,
        ctx.endDate,
        ctx.granularity,
        customStart,
        ctx.compareEndDate,
        0,
        ctx.compareAlignWeekdays,
      );
      ctx.setCompareDateRange(resolved.compare?.start, resolved.compare?.end);
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
