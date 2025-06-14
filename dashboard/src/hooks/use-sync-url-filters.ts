import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BAFilterSearchParams } from '@/utils/filterSearchParams';
import { useQueryFiltersContext } from "@/contexts/QueryFiltersContextProvider";
import { useTimeRangeContext } from "@/contexts/TimeRangeContextProvider";
import { useUserJourneyFilter } from "@/contexts/UserJourneyFilterContextProvider";

const URL_PARAM_NAME = 'filters';

export function useSyncURLFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { queryFilters, setQueryFilters } = useQueryFiltersContext();
  const { startDate, endDate, granularity, setPeriod, setGranularity } = useTimeRangeContext();
  const { numberOfSteps, setNumberOfSteps, numberOfJourneys, setNumberOfJourneys } = useUserJourneyFilter();

  useEffect(() => {
    try {
      const encodedFilters = searchParams.get(URL_PARAM_NAME);
      if (encodedFilters) {
        const filters = BAFilterSearchParams.decode(encodedFilters);
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
      }
    } catch(error) {
      console.error("Failed to set filters:", error);
    }
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(searchParams.toString());
            
      const encodedFilters = BAFilterSearchParams.encode({
        queryFilters,
        startDate,
        endDate,
        granularity,
        userJourney: {
          numberOfSteps,
          numberOfJourneys
        }
      });
      
      params.set(URL_PARAM_NAME, encodedFilters);
      
      router.replace(`?${params.toString()}`);
      router.refresh();

    } catch(error) {
      console.error("Failed to add filters:", error)
    }
  }, [queryFilters, startDate, endDate, granularity, numberOfSteps, numberOfJourneys]);
}