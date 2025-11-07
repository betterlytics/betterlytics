import React, { Dispatch, SetStateAction, useCallback, useMemo, useEffect } from 'react';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { TimeRangeValue } from '@/utils/timeRanges';
import { CompareMode } from '@/utils/compareRanges';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';

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
  setCompareDateRange: (startDate?: Date, endDate?: Date) => void;
  compareAlignWeekdays: boolean;
  setCompareAlignWeekdays: Dispatch<SetStateAction<boolean>>;
  timeZone: string;
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

  const timeZone = React.useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const setPeriod = useCallback((newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(new Date(newEndDate.getTime() - 1_000)); // Subtract 1 second for formatting
  }, []);

  const handleSetCompareDateRange = useCallback((csDate?: Date, ceDate?: Date) => {
    if (!csDate || !ceDate) return;
    setCompareStartDate(csDate);
    setCompareEndDate(new Date(ceDate.getTime() - 1_000)); // Subtract 1 second for formatting
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
      }}
    >
      {children}
    </TimeRangeContext.Provider>
  );
}

export function useTimeRangeContext() {
  return React.useContext(TimeRangeContext);
}
