import React, { Dispatch, SetStateAction, useCallback, useMemo, useEffect } from 'react';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { getDateWithTimeOfDay, TimeRangeValue } from '@/utils/timeRanges';
import { CompareMode, deriveCompareRange, isDerivedCompareMode } from '@/utils/compareRanges';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { addDays, differenceInCalendarDays } from 'date-fns';
import { getAllowedGranularities, getValidGranularityFallback } from '@/utils/granularityRanges';

type TimeRangeContextProps = {
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
  setCompareDateRange: (startDate: Date, endDate: Date) => void;
  compareAlignWeekdays: boolean;
  setCompareAlignWeekdays: Dispatch<SetStateAction<boolean>>;
};

const TimeRangeContext = React.createContext<TimeRangeContextProps>({} as TimeRangeContextProps);

type TimeRangeContextProviderProps = {
  children: React.ReactNode;
};

export function TimeRangeContextProvider({ children }: TimeRangeContextProviderProps) {
  const defaultFilters = useMemo(() => BAFilterSearchParams.getDefaultFilters(), []);

  const [startDate, setStartDate] = React.useState<Date>(defaultFilters.startDate);
  const [endDate, setEndDate] = React.useState<Date>(defaultFilters.endDate);

  const [granularity, setGranularity] = React.useState<GranularityRangeValues>(defaultFilters.granularity);
  const [interval, setInterval] = React.useState<TimeRangeValue>(defaultFilters.interval);
  const [offset, setOffset] = React.useState<number>(0);
  const [compareMode, setCompareMode] = React.useState<CompareMode>(defaultFilters.compare);
  const [compareStartDate, setCompareStartDate] = React.useState<Date | undefined>(
    defaultFilters.compareStartDate,
  );
  const [compareEndDate, setCompareEndDate] = React.useState<Date | undefined>(defaultFilters.compareEndDate);
  const [compareAlignWeekdays, setCompareAlignWeekdays] = React.useState<boolean>(false);

  const setPeriod = useCallback((newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, []);

  const handleSetCompareDateRange = useCallback((csDate: Date, ceDate: Date) => {
    setCompareStartDate(csDate);
    setCompareEndDate(ceDate);
  }, []);

  // Invariant: normalize granularity whenever the main period changes
  useEffect(() => {
    const allowed = getAllowedGranularities(startDate, endDate);
    const nextGranularity = getValidGranularityFallback(granularity, allowed);
    if (granularity !== nextGranularity) {
      setGranularity(nextGranularity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // Invariant: when compare is custom, enforce equal-length compare range
  useEffect(() => {
    if (compareMode !== 'custom' || !compareStartDate) return;
    const days = differenceInCalendarDays(endDate, startDate);
    const start = getDateWithTimeOfDay(compareStartDate, startDate);
    const desiredEnd = getDateWithTimeOfDay(addDays(start.getTime(), days), endDate);
    if (!compareEndDate || compareEndDate.getTime() !== desiredEnd.getTime()) {
      setCompareStartDate(start);
      setCompareEndDate(desiredEnd);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareMode, startDate, endDate, compareStartDate]);

  // Invariant: when compare mode is derived (previous/year), recompute compare range when main period or alignment changes
  useEffect(() => {
    if (!isDerivedCompareMode(compareMode)) return;
    const derived = deriveCompareRange(startDate, endDate, compareMode, undefined, compareAlignWeekdays);
    if (!derived) return;

    if (
      derived.startDate.getTime() !== (compareStartDate?.getTime() ?? 0) ||
      derived.endDate.getTime() !== (compareEndDate?.getTime() ?? 0)
    ) {
      setCompareStartDate(derived.startDate);
      setCompareEndDate(derived.endDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareMode, startDate, endDate, compareAlignWeekdays]);

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
      }}
    >
      {children}
    </TimeRangeContext.Provider>
  );
}

export function useTimeRangeContext() {
  return React.useContext(TimeRangeContext);
}
