import { useCallback, useEffect, useMemo, useRef } from 'react';
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
  'offset',
  'compare',
  'compareAlignWeekdays',
  'userJourney',
] as const;

export function useSyncURLFilters() {
  const router = useBARouter();
  const searchParams = useSearchParams();
  const applyingFromUrlRef = useRef<boolean>(false);

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
    offset,
    setOffset,
    compareMode,
    setCompareMode,
    compareAlignWeekdays,
    setCompareAlignWeekdays,
  } = useTimeRangeContext();
  const { numberOfSteps, setNumberOfSteps, numberOfJourneys, setNumberOfJourneys } = useUserJourneyFilter();

  // URL -> state
  useEffect(() => {
    try {
      applyingFromUrlRef.current = true;

      const encodedFilterEntries = URL_SEARCH_PARAMS.map(
        (param) => [param, searchParams?.get(param) ?? undefined] as const,
      ).filter(([_key, value]) => Boolean(value));

      const encoded = Object.fromEntries(encodedFilterEntries);

      const filters = BAFilterSearchParams.decode(encoded, Intl.DateTimeFormat().resolvedOptions().timeZone);

      if (filters.startDate && filters.endDate) {
        setPeriod(filters.startDate, filters.endDate);
      }
      if (filters.granularity) {
        setGranularity(filters.granularity);
      }
      if (filters.interval) {
        setInterval(filters.interval);
      }
      if (filters.offset !== undefined) {
        setOffset(filters.offset);
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
      if (filters.compareAlignWeekdays !== undefined) {
        setCompareAlignWeekdays(Boolean(filters.compareAlignWeekdays));
      }
    } catch (error) {
      console.error('Failed to set filters:', error);
    } finally {
      applyingFromUrlRef.current = false;
    }
  }, [searchParams]);

  // State -> URL
  useEffect(() => {
    try {
      if (applyingFromUrlRef.current) {
        return;
      }

      const rawEncoded = BAFilterSearchParams.encode({
        queryFilters,
        startDate,
        endDate,
        granularity,
        interval,
        offset,
        compare: compareMode,
        compareAlignWeekdays,
        userJourney: {
          numberOfSteps,
          numberOfJourneys,
        },
        // Only include compare dates for custom mode when both are present
        compareStartDate:
          compareMode === 'custom' && compareStartDate && compareEndDate ? compareStartDate : undefined,
        compareEndDate:
          compareMode === 'custom' && compareStartDate && compareEndDate ? compareEndDate : undefined,
      });

      const showMainDates = interval === 'custom';
      const showCompareDates = compareMode === 'custom';

      const encodedFilters = rawEncoded.filter(([key]) => {
        if (key === 'startDate' || key === 'endDate') return showMainDates;
        if (key === 'compareStartDate' || key === 'compareEndDate') return showCompareDates;
        return true;
      });

      const currentParamsString = searchParams?.toString() ?? '';
      const nextParams = new URLSearchParams(currentParamsString);
      URL_SEARCH_PARAMS.forEach((key) => nextParams.delete(key));
      encodedFilters.forEach(([key, value]) => nextParams.set(key, value));

      if (nextParams.toString() === currentParamsString) return;

      const updateRouteTimeout = setTimeout(() => router.push(`?${nextParams.toString()}`, { scroll: false }), 10);
      return () => clearTimeout(updateRouteTimeout);
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
    offset,
    compareMode,
    compareAlignWeekdays,
    numberOfSteps,
    numberOfJourneys,
    router,
  ]);
}

export function useUrlSearchParam(paramKey: string) {
  const router = useBARouter();
  const searchParams = useSearchParams();

  const value = useMemo(() => searchParams?.get(paramKey) ?? undefined, [searchParams, paramKey]);

  const setValue = useCallback(
    (next: string | undefined) => {
      const currentParams = new URLSearchParams(searchParams?.toString());
      const nextParams = new URLSearchParams(searchParams?.toString());
      if (next === undefined || next === null || next === '') {
        nextParams.delete(paramKey);
      } else {
        nextParams.set(paramKey, next);
      }
      if (nextParams.toString() === currentParams.toString()) {
        return;
      }
      router.push(`?${nextParams.toString()}`, { scroll: false });
    },
    [router, searchParams, paramKey],
  );

  const res = useMemo(() => [value, setValue] as const, [value, setValue]);

  return res;
}
