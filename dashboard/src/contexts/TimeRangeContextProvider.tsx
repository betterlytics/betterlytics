import React, { Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';

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
  const defaultFilters = useMemo(() => BAFilterSearchParams.getDefaultFilters(), []);

  const [startDate, setStartDate] = React.useState<Date>(defaultFilters.startDate);
  const [endDate, setEndDate] = React.useState<Date>(defaultFilters.endDate);

  const [granularity, setGranularity] = React.useState<GranularityRangeValues>(defaultFilters.granularity);
  const [compareEnabled, setCompareEnabled] = React.useState<boolean>(Boolean(defaultFilters.compareEnabled));
  const [compareStartDate, setCompareStartDate] = React.useState<Date | undefined>(
    defaultFilters.compareStartDate,
  );
  const [compareEndDate, setCompareEndDate] = React.useState<Date | undefined>(defaultFilters.compareEndDate);

  const setPeriod = useCallback((newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  }, []);

  const handleSetCompareDateRange = useCallback((csDate: Date, ceDate: Date) => {
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
