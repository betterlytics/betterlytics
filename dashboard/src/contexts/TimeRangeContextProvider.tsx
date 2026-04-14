import React, { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { TimeRangeValue } from '@/utils/timeRanges';
import { CompareMode } from '@/utils/compareRanges';
import { getResolvedRanges, type TimeRangeResult } from '@/lib/ba-timerange';
import { BAAnalyticsQuery } from '@/entities/analytics/analyticsQuery.entities';

export type TimeRangeContextProps = {
  startDate: Date;
  endDate: Date;
  setPeriod: (startDate: Date, endDate: Date) => void;
  granularity: GranularityRangeValues;
  setGranularity: Dispatch<SetStateAction<GranularityRangeValues>>;
  interval: TimeRangeValue;
  setInterval: Dispatch<SetStateAction<TimeRangeValue>>;
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
};

const TimeRangeContext = React.createContext<TimeRangeContextProps>({} as TimeRangeContextProps);

type TimeRangeContextProviderProps = {
  children: React.ReactNode;
  initialFilters: BAAnalyticsQuery;
};

export function TimeRangeContextProvider({ children, initialFilters }: TimeRangeContextProviderProps) {
  const [startDate, setStartDate] = React.useState<Date>(initialFilters.startDate);
  const [endDate, setEndDate] = React.useState<Date>(initialFilters.endDate);

  const [granularity, setGranularity] = React.useState<GranularityRangeValues>(initialFilters.granularity);
  const [interval, setInterval] = React.useState<TimeRangeValue>(initialFilters.interval);
  const [offset, setOffset] = React.useState<number>(initialFilters.offset ?? 0);
  const [compareMode, setCompareMode] = React.useState<CompareMode>(initialFilters.compare);
  const [compareStartDate, setCompareStartDate] = React.useState<Date | undefined>(
    initialFilters.compareStartDate,
  );
  const [compareEndDate, setCompareEndDate] = React.useState<Date | undefined>(initialFilters.compareEndDate);
  const [compareAlignWeekdays, setCompareAlignWeekdays] = React.useState<boolean>(
    initialFilters.compareAlignWeekdays ?? false,
  );

  const timeZone = React.useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

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

  const setPeriod = useCallback((newStartDate: Date, newEndDate: Date) => {
    setStartDate((date) => (date.getTime() === newStartDate.getTime() ? date : newStartDate));
    setEndDate((date) => (date.getTime() === newEndDate.getTime() ? date : newEndDate));
  }, []);

  const handleSetCompareDateRange = useCallback((csDate?: Date, ceDate?: Date) => {
    if (!csDate || !ceDate) return;
    setCompareStartDate(csDate);
    setCompareEndDate(ceDate);
  }, []);

  return (
    <TimeRangeContext.Provider
      value={{
        startDate,
        endDate,
        setPeriod,
        granularity,
        setGranularity,
        interval,
        setInterval,
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
      }}
    >
      {children}
    </TimeRangeContext.Provider>
  );
}

export function useTimeRangeContext() {
  return React.useContext(TimeRangeContext);
}
