import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';

const URL_PARAM_NAME = 'filters';

export function useSyncURLFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { queryFilters, setQueryFilters } = useQueryFiltersContext();
  const {
    startDate,
    endDate,
    granularity,
    setPeriod,
    setGranularity,
    compareEnabled,
    compareStartDate,
    compareEndDate,
    setCompareDateRange,
    setCompareEnabled,
  } = useTimeRangeContext();
  const { numberOfSteps, setNumberOfSteps, numberOfJourneys, setNumberOfJourneys } = useUserJourneyFilter();

  useEffect(() => {
    try {
      const encodedFilters = searchParams?.get(URL_PARAM_NAME);
      const filters = encodedFilters
        ? BAFilterSearchParams.decode(encodedFilters)
        : BAFilterSearchParams.getDefaultFilters();
      if (filters.startDate && filters.endDate) {
        setPeriod(filters.startDate, filters.endDate);
      }
      if (filters.granularity) {
        setGranularity(filters.granularity);
      }
      if (filters.queryFilters) {
        setQueryFilters(filters.queryFilters);
      }
      if (filters.userJourney) {
        if (filters.userJourney.numberOfSteps) {
          setNumberOfSteps(filters.userJourney.numberOfSteps);
        }
        if (filters.userJourney.numberOfJourneys) {
          setNumberOfJourneys(filters.userJourney.numberOfJourneys);
        }
      }
      setCompareEnabled(Boolean(filters.compareEnabled));
      if (filters.compareStartDate && filters.compareEndDate) {
        setCompareDateRange(filters.compareStartDate, filters.compareEndDate);
      }
    } catch (error) {
      console.error('Failed to set filters:', error);
    }
  }, []);

  useEffect(() => {
    try {
      const encodedFilters = BAFilterSearchParams.encode({
        queryFilters,
        startDate,
        endDate,
        granularity,
        userJourney: {
          numberOfSteps,
          numberOfJourneys,
        },
        compareStartDate: compareStartDate && compareEndDate ? compareStartDate : undefined,
        compareEndDate: compareStartDate && compareEndDate ? compareEndDate : undefined,
        compareEnabled: compareEnabled,
      });

      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.set(URL_PARAM_NAME, encodedFilters);
      router.replace(`?${params.toString()}`);
      router.refresh();
    } catch (error) {
      console.error('Failed to add filters:', error);
    }
  }, [queryFilters, startDate, endDate, granularity, numberOfSteps, numberOfJourneys]);
}
