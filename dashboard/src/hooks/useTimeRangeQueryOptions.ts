import { useMemo } from 'react';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

type TimeRangeQueryOptions = {
  staleTime: number;
  gcTime: number;
  refetchOnWindowFocus: boolean;
  refetchInterval: number | false;
};

function getTimeRangeStaleTime(startDate: Date, endDate: Date): number {
  const rangeMs = endDate.getTime() - startDate.getTime();
  const hourMs = 60 * 60 * 1000;

  if (rangeMs <= hourMs) {
    // Very short range (e.g. realtime / last hour) – prefer fresher data
    return 30_000;
  }

  if (rangeMs <= 24 * hourMs) {
    // Up to 24h: allow a bit of caching but still reasonably fresh
    return 5 * 60_000;
  }

  // Longer ranges: data changes slowly, so we can cache for longer
  return 15 * 60_000;
}

export function useTimeRangeQueryOptions(): TimeRangeQueryOptions {
  const { startDate, endDate, interval } = useTimeRangeContext();

  return useMemo(() => {
    const isRealtime = interval === 'realtime' || interval === '1h';

    if (isRealtime) {
      return {
        staleTime: 0,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchInterval: false,
      };
    }

    const staleTime = getTimeRangeStaleTime(startDate, endDate);

    return {
      staleTime,
      gcTime: Math.max(staleTime, 15 * 60_000),
      refetchOnWindowFocus: false,
      refetchInterval: false,
    };
  }, [startDate, endDate, interval]);
}
