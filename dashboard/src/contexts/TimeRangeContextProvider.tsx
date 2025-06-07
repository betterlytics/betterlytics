import React, { Dispatch, SetStateAction, useCallback } from 'react';
import { getDateRangeForTimePresets } from '@/utils/timeRanges';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { startOfDay, endOfDay } from 'date-fns';

type TimeRangeContextProps = {
  startDate: Date;
  endDate: Date;
  setPeriod: (startDate: Date, endDate: Date) => void;
  granularity: GranularityRangeValues;
  setGranularity: Dispatch<SetStateAction<GranularityRangeValues>>;
  compareStartDate?: Date;
  compareEndDate?: Date;
  setCompareDateRange: (startDate: Date, endDate: Date) => void;
  clearComparison: () => void;
};

const TimeRangeContext = React.createContext<TimeRangeContextProps>({} as TimeRangeContextProps);

type TimeRangeContextProviderProps = {
  children: React.ReactNode;
};

export function TimeRangeContextProvider({ children }: TimeRangeContextProviderProps) {
  const initialRangeDetails = getDateRangeForTimePresets('7d');
  const [startDate, setStartDate] = React.useState<Date>(initialRangeDetails.startDate);
  const [endDate, setEndDate] = React.useState<Date>(initialRangeDetails.endDate);

  const [granularity, setGranularity] = React.useState<GranularityRangeValues>('day');
  const [compareStartDate, setCompareStartDate] = React.useState<Date | undefined>(undefined);
  const [compareEndDate, setCompareEndDate] = React.useState<Date | undefined>(undefined);

  const setPeriod = useCallback((newStartDate: Date, newEndDate: Date) => {
    setStartDate(startOfDay(newStartDate));
    setEndDate(endOfDay(newEndDate));
  }, []);

  const handleSetCompareDateRange = useCallback((csDate: Date, ceDate: Date) => {
    setCompareStartDate(startOfDay(csDate));
    setCompareEndDate(endOfDay(ceDate));
  }, []);

  const clearComparison = useCallback(() => {
    setCompareStartDate(undefined);
    setCompareEndDate(undefined);
  }, []);

  return (
    <TimeRangeContext.Provider
      value={{
        startDate,
        endDate,
        setPeriod,
        granularity,
        setGranularity,
        compareStartDate,
        compareEndDate,
        setCompareDateRange: handleSetCompareDateRange,
        clearComparison,
      }}
    >
      {children}
    </TimeRangeContext.Provider>
  );
}

export function useTimeRangeContext() {
  return React.useContext(TimeRangeContext);
}
