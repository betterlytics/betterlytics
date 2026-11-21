import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef } from 'react';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { TimeRangeValue } from '@/utils/timeRanges';
import { CompareMode } from '@/utils/compareRanges';
import { getResolvedRanges, type TimeRangeResult } from '@/lib/ba-timerange';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';
import { useResolvedTimezone } from '@/hooks/use-resolved-timezone';
import { keepWallClock } from '@/utils/timezone';

export type TimeRangeContextProps = {
  startDate: Date;
  endDate: Date;
  setPeriod: (startDate: Date, endDate: Date) => void;
  granularity: GranularityRangeValues;
  setGranularity: Dispatch<SetStateAction<GranularityRangeValues>>;
  interval: TimeRangeValue;
  setRangeInterval: Dispatch<SetStateAction<TimeRangeValue>>;
  offset: number;
  setOffset: Dispatch<SetStateAction<number>>;
  compareMode: CompareMode;
  setCompareMode: Dispatch<SetStateAction<CompareMode>>;
  compareStartDate?: Date;
  compareEndDate?: Date;
  setCompareDateRange: (startDate?: Date, endDate?: Date) => void;
  compareAlignWeekdays: boolean;
  setCompareAlignWeekdays: Dispatch<SetStateAction<boolean>>;
  timeZone: string;
  resolvedRanges: TimeRangeResult;
  resolvedMainRange: TimeRangeResult['main'];
  resolvedCompareRange?: TimeRangeResult['compare'];
  resolvedGranularity: TimeRangeResult['granularity'];
  recordZoom: (startDate: Date, endDate: Date) => void;
  isZoomed: boolean;
  resetZoom: () => void;
};

const TimeRangeContext = React.createContext<TimeRangeContextProps>({} as TimeRangeContextProps);

type TimeRangeContextProviderProps = {
  children: React.ReactNode;
  initialFilters: BAAnalyticsQuery;
};

// Stored dates keep the zone they were set in
type ZonedPeriod = { start: Date; end: Date; timeZone: string };
type ZonedComparePeriod = { start?: Date; end?: Date; timeZone: string };

type TimeRangeSnapshot = {
  period: ZonedPeriod;
  granularity: GranularityRangeValues;
  interval: TimeRangeValue;
  offset: number;
  comparePeriod: ZonedComparePeriod;
};

// The state before the first zoom of a chain, and the periods the chain's zooms produced
type ZoomChain = { before: TimeRangeSnapshot; zoomedKeys: string[] };

const getPeriodKey = (interval: TimeRangeValue, start: Date, end: Date) =>
  `${interval}:${start.getTime()}:${end.getTime()}`;

export function TimeRangeContextProvider({ children, initialFilters }: TimeRangeContextProviderProps) {
  const { timeZone } = useResolvedTimezone();

  const [period, setPeriodState] = React.useState<ZonedPeriod>({
    start: initialFilters.startDate,
    end: initialFilters.endDate,
    timeZone,
  });

  const [granularity, setGranularity] = React.useState<GranularityRangeValues>(initialFilters.granularity);
  const [interval, setRangeInterval] = React.useState<TimeRangeValue>(initialFilters.interval);
  const [offset, setOffset] = React.useState<number>(initialFilters.offset ?? 0);
  const [compareMode, setCompareMode] = React.useState<CompareMode>(initialFilters.compare);
  const [comparePeriod, setComparePeriod] = React.useState<ZonedComparePeriod>({
    start: initialFilters.compareStartDate,
    end: initialFilters.compareEndDate,
    timeZone,
  });
  const [compareAlignWeekdays, setCompareAlignWeekdays] = React.useState<boolean>(
    initialFilters.compareAlignWeekdays ?? false,
  );

  // A zone change converts the stored dates here instead of writing state, since React can drop state set
  // during render: custom ranges keep their calendar days and presets are re-resolved in the new zone
  const { startDate, endDate } = useMemo(() => {
    if (period.timeZone === timeZone) return { startDate: period.start, endDate: period.end };
    if (interval === 'custom') {
      return {
        startDate: keepWallClock(period.start, period.timeZone, timeZone),
        endDate: keepWallClock(period.end, period.timeZone, timeZone),
      };
    }
    const { main } = getResolvedRanges(
      interval,
      compareMode,
      timeZone,
      period.start,
      period.end,
      granularity,
      undefined,
      undefined,
      offset,
      compareAlignWeekdays,
    );
    return { startDate: main.start, endDate: main.end };
  }, [period, timeZone, interval, compareMode, granularity, offset, compareAlignWeekdays]);

  const { compareStartDate, compareEndDate } = useMemo(() => {
    const { start, end, timeZone: zone } = comparePeriod;
    if (!start || !end || zone === timeZone) return { compareStartDate: start, compareEndDate: end };
    return {
      compareStartDate: keepWallClock(start, zone, timeZone),
      compareEndDate: keepWallClock(end, zone, timeZone),
    };
  }, [comparePeriod, timeZone]);

  const resolvedRanges = useMemo(
    () =>
      getResolvedRanges(
        interval,
        compareMode,
        timeZone,
        startDate,
        endDate,
        granularity,
        compareStartDate,
        compareEndDate,
        offset,
        compareAlignWeekdays,
        true,
      ),
    [
      interval,
      compareMode,
      timeZone,
      startDate,
      endDate,
      granularity,
      compareStartDate,
      compareEndDate,
      offset,
      compareAlignWeekdays,
    ],
  );

  const resolvedMainEndMsRef = useRef(resolvedRanges.main.end.getTime());
  useEffect(() => {
    resolvedMainEndMsRef.current = resolvedRanges.main.end.getTime();
  }, [resolvedRanges]);

  // Advance dates when a boundary is crossed (e.g. hour rolls over on 24h mode).
  useEffect(() => {
    if (interval === 'custom' || interval === 'realtime') return;

    const id = setInterval(() => {
      const now = new Date();
      const fresh = getResolvedRanges(
        interval,
        compareMode,
        timeZone,
        now,
        now,
        granularity,
        undefined,
        undefined,
        offset,
        compareAlignWeekdays,
      );
      if (fresh.main.end.getTime() !== resolvedMainEndMsRef.current) {
        setPeriod(fresh.main.start, fresh.main.end);
      }
    }, 30_000);

    return () => clearInterval(id);
  }, [interval, compareMode, timeZone, granularity, offset, compareAlignWeekdays]);

  // Callers compute dates in the zone of the render they come from, which is the zone recorded here
  const setPeriod = useCallback(
    (newStartDate: Date, newEndDate: Date) => {
      setPeriodState((prev) => {
        if (prev.timeZone !== timeZone) return { start: newStartDate, end: newEndDate, timeZone };
        const start = prev.start.getTime() === newStartDate.getTime() ? prev.start : newStartDate;
        const end = prev.end.getTime() === newEndDate.getTime() ? prev.end : newEndDate;
        return start === prev.start && end === prev.end ? prev : { start, end, timeZone };
      });
    },
    [timeZone],
  );

  const handleSetCompareDateRange = useCallback(
    (csDate?: Date, ceDate?: Date) => {
      if (!csDate || !ceDate) return;
      setComparePeriod({ start: csDate, end: ceDate, timeZone });
    },
    [timeZone],
  );

  // Held in the page only, and active while the period is one a zoom produced, so any other range change
  // (picker, arrows, Back past the first zoom) hides the reset
  const [zoomChain, setZoomChain] = React.useState<ZoomChain | null>(null);
  const periodKey = getPeriodKey(interval, startDate, endDate);
  const isZoomed = zoomChain?.zoomedKeys.includes(periodKey) ?? false;

  const recordZoom = useCallback(
    (zoomStart: Date, zoomEnd: Date) => {
      const zoomedKey = getPeriodKey('custom', zoomStart, zoomEnd);
      const before: TimeRangeSnapshot = { period, granularity, interval, offset, comparePeriod };
      setZoomChain((prev) =>
        prev?.zoomedKeys.includes(periodKey)
          ? { ...prev, zoomedKeys: [...prev.zoomedKeys, zoomedKey] }
          : { before, zoomedKeys: [zoomedKey] },
      );
    },
    [period, granularity, interval, offset, comparePeriod, periodKey],
  );

  const resetZoom = useCallback(() => {
    if (!zoomChain) return;
    const { before } = zoomChain;
    setPeriodState(before.period);
    setGranularity(before.granularity);
    setRangeInterval(before.interval);
    setOffset(before.offset);
    setComparePeriod(before.comparePeriod);
    setZoomChain(null);
  }, [zoomChain]);

  return (
    <TimeRangeContext.Provider
      value={{
        startDate,
        endDate,
        setPeriod,
        // The granularity the ranges resolved to, which differs from the picked one after a fallback
        granularity: resolvedRanges.granularity,
        setGranularity,
        interval,
        setRangeInterval,
        offset,
        setOffset,
        compareMode,
        setCompareMode,
        compareStartDate,
        compareEndDate,
        setCompareDateRange: handleSetCompareDateRange,
        compareAlignWeekdays,
        setCompareAlignWeekdays,
        timeZone,
        resolvedRanges,
        resolvedMainRange: resolvedRanges.main,
        resolvedCompareRange: resolvedRanges.compare,
        resolvedGranularity: resolvedRanges.granularity,
        recordZoom,
        isZoomed,
        resetZoom,
      }}
    >
      {children}
    </TimeRangeContext.Provider>
  );
}

export function useTimeRangeContext() {
  return React.useContext(TimeRangeContext);
}
