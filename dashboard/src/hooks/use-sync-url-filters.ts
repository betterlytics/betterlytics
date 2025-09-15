import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { useBARouter } from '@/hooks/use-ba-router';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useUserJourneyFilter } from '@/contexts/UserJourneyFilterContextProvider';

const URL_SEARCH_PARAMS = [
  'queryFilters',
  'granularity',
  'startDate',
  'endDate',
  'compareEnabled',
  'compareStartDate',
  'compareEndDate',
  'userJourney',
] as const;

export function useSyncURLFilters() {
  const router = useBARouter();
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
      const encodedFilterEntries = URL_SEARCH_PARAMS.map(
        (param) => [param, searchParams.get(param)] as const,
      ).filter(([_key, value]) => Boolean(value));

      const encoded = Object.fromEntries(encodedFilterEntries);

      const filters = BAFilterSearchParams.decode(encoded);

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
      const newlyEncodedFilters = BAFilterSearchParams.encode({
        queryFilters,
        startDate,
        endDate,
        granularity,
        userJourney: {
          numberOfSteps,
          numberOfJourneys,
        },
        compareStartDate: compareEnabled && compareStartDate && compareEndDate ? compareStartDate : undefined,
        compareEndDate: compareEnabled && compareStartDate && compareEndDate ? compareEndDate : undefined,
        compareEnabled: compareEnabled,
      });

      const params = new URLSearchParams(searchParams?.toString() ?? '');
      newlyEncodedFilters.forEach(([key, value]) => params.set(key, value));
      router.replace(`?${params.toString()}`);
    } catch (error) {
      console.error('Failed to add filters:', error);
    }
  }, [
    queryFilters,
    startDate,
    endDate,
    compareEnabled,
    compareStartDate,
    compareEndDate,
    granularity,
    numberOfSteps,
    numberOfJourneys,
  ]);
}
