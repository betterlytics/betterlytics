import React, { Dispatch, SetStateAction, useCallback, useEffect } from 'react';
import { getDateRangeForTimePresets } from '@/utils/timeRanges';
import {
  GranularityRangeValues,
  getAllowedGranularities,
  getValidGranularityFallback,
} from '@/utils/granularityRanges';

type TimeRangeContextProps = {
  startDate: Date;
  endDate: Date;
  setPeriod: (startDate: Date, endDate: Date) => void;
  granularity: GranularityRangeValues;
  setGranularity: Dispatch<SetStateAction<GranularityRangeValues>>;
  compareEnabled: boolean;
  setCompareEnabled: Dispatch<SetStateAction<boolean>>;
  compareStartDate?: Date;
  compareEndDate?: Date;
  setCompareDateRange: (startDate: Date, endDate: Date) => void;
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
  const [compareEnabled, setCompareEnabled] = React.useState<boolean>(false);
  const [compareStartDate, setCompareStartDate] = React.useState<Date | undefined>(undefined);
  const [compareEndDate, setCompareEndDate] = React.useState<Date | undefined>(undefined);

  useEffect(() => {
    const newRangeDetails = getDateRangeForTimePresets('7d');
    setStartDate(newRangeDetails.startDate);
    setEndDate(newRangeDetails.endDate);
  }, []);

  const setPeriod = useCallback((newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, []);

  const handleSetCompareDateRange = useCallback((csDate: Date, ceDate: Date) => {
    setCompareStartDate(csDate);
    setCompareEndDate(ceDate);
  }, []);

  useEffect(() => {
    const allowedGranularities = getAllowedGranularities(startDate, endDate);
    if (!allowedGranularities.includes(granularity)) {
      const validGranularity = getValidGranularityFallback(granularity, allowedGranularities);
      setGranularity(validGranularity);
    }
  }, [startDate, endDate, granularity, setGranularity]);

  return (
    <TimeRangeContext.Provider
      value={{
        startDate,
        endDate,
        setPeriod,
        granularity,
        setGranularity,
        compareEnabled,
        setCompareEnabled,
        compareStartDate,
        compareEndDate,
        setCompareDateRange: handleSetCompareDateRange,
      }}
    >
      {children}
    </TimeRangeContext.Provider>
  );
}

export function useTimeRangeContext() {
  return React.useContext(TimeRangeContext);
}
