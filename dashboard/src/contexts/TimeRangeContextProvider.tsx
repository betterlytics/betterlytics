import React, { Dispatch, SetStateAction, useCallback, useEffect } from 'react';
import { getDateRangeForTimePresets } from '@/utils/timeRanges';
import {
  GranularityRangeValues,
  getAllowedGranularities,
  getValidGranularityFallback,
} from '@/utils/granularityRanges';
import { useUserTimezone } from '@/hooks/use-user-timezone';
import type { UTCDate } from '@/utils/timezoneHelpers';

type TimeRangeContextProps = {
  startDate: UTCDate;
  endDate: UTCDate;
  setPeriod: (startDate: UTCDate, endDate: UTCDate) => void;
  granularity: GranularityRangeValues;
  setGranularity: Dispatch<SetStateAction<GranularityRangeValues>>;
  compareEnabled: boolean;
  setCompareEnabled: Dispatch<SetStateAction<boolean>>;
  compareStartDate?: UTCDate;
  compareEndDate?: UTCDate;
  setCompareDateRange: (startDate: UTCDate, endDate: UTCDate) => void;
  userTimezone: string;
};

const TimeRangeContext = React.createContext<TimeRangeContextProps>({} as TimeRangeContextProps);

type TimeRangeContextProviderProps = {
  children: React.ReactNode;
};

export function TimeRangeContextProvider({ children }: TimeRangeContextProviderProps) {
  const userTimezone = useUserTimezone();
  const initialRangeDetails = getDateRangeForTimePresets('7d', userTimezone);
  const [startDate, setStartDate] = React.useState<UTCDate>(initialRangeDetails.startDate);
  const [endDate, setEndDate] = React.useState<UTCDate>(initialRangeDetails.endDate);

  const [granularity, setGranularity] = React.useState<GranularityRangeValues>('day');
  const [compareEnabled, setCompareEnabled] = React.useState<boolean>(false);
  const [compareStartDate, setCompareStartDate] = React.useState<UTCDate | undefined>(undefined);
  const [compareEndDate, setCompareEndDate] = React.useState<UTCDate | undefined>(undefined);

  useEffect(() => {
    const newRangeDetails = getDateRangeForTimePresets('7d', userTimezone);
    setStartDate(newRangeDetails.startDate);
    setEndDate(newRangeDetails.endDate);
  }, [userTimezone]);

  const setPeriod = useCallback((newStartDate: UTCDate, newEndDate: UTCDate) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, []);

  const handleSetCompareDateRange = useCallback((csDate: UTCDate, ceDate: UTCDate) => {
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
        userTimezone,
      }}
    >
      {children}
    </TimeRangeContext.Provider>
  );
}

export function useTimeRangeContext() {
  return React.useContext(TimeRangeContext);
}
