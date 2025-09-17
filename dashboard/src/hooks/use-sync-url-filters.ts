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
  'compareStartDate',
  'compareEndDate',
  'interval',
  'compare',
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
    compareStartDate,
    compareEndDate,
    setCompareDateRange,
    interval,
    setInterval,
    compareMode,
    setCompareMode,
  } = useTimeRangeContext();
  const { numberOfSteps, setNumberOfSteps, numberOfJourneys, setNumberOfJourneys } = useUserJourneyFilter();

  useEffect(() => {
    try {
      const encodedFilterEntries = URL_SEARCH_PARAMS.map(
        (param) => [param, searchParams?.get(param)] as const,
      ).filter(([_key, value]) => Boolean(value));

      const encoded = Object.fromEntries(encodedFilterEntries);

      const filters = BAFilterSearchParams.decode(encoded);

      if (filters.startDate && filters.endDate) {
        setPeriod(filters.startDate, filters.endDate);
      }
      if (filters.granularity) {
        setGranularity(filters.granularity);
      }
      if (filters.interval) {
        setInterval(filters.interval);
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
      if (filters.compare) {
        if (filters.compare === 'off') {
          setCompareMode('off');
        } else if (filters.compare === 'previous') {
          setCompareMode('previous');
        } else if (filters.compare === 'year') {
          setCompareMode('year');
        } else if (filters.compare === 'custom') {
          setCompareMode('custom');
          if (filters.compareStartDate && filters.compareEndDate) {
            setCompareDateRange(filters.compareStartDate, filters.compareEndDate);
          }
        }
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
        interval,
        compare: compareMode,
        userJourney: {
          numberOfSteps,
          numberOfJourneys,
        },
        // Only include compare dates for custom mode when both are present
        compareStartDate:
          compareMode !== 'off' && compareStartDate && compareEndDate ? compareStartDate : undefined,
        compareEndDate: compareMode !== 'off' && compareStartDate && compareEndDate ? compareEndDate : undefined,
      });

      const params = new URLSearchParams(searchParams?.toString() ?? '');

      URL_SEARCH_PARAMS.forEach((key) => params.delete(key));
      encodedFilters.forEach(([key, value]) => params.set(key, value));
      router.replace(`?${params.toString()}`);
    } catch (error) {
      console.error('Failed to add filters:', error);
    }
  }, [
    queryFilters,
    startDate,
    endDate,
    compareStartDate,
    compareEndDate,
    granularity,
    interval,
    compareMode,
    numberOfSteps,
    numberOfJourneys,
  ]);
}
