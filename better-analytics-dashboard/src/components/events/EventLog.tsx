'use client';

import React, { useRef, useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { EventLogEntry } from '@/entities/events';
import { fetchRecentEventsAction, fetchTotalEventCountAction } from '@/app/actions/events';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { formatNumber } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { EventLogItem } from './EventLogItem';

const DEFAULT_PAGE_SIZE = 25;
const EVENTS_REFRESH_INTERVAL_MS = 30 * 1000; // 30 seconds
const COUNT_REFRESH_INTERVAL_MS = 60 * 1000; // 1 minute

interface EventLogProps {
  pageSize?: number;
}

const LiveIndicator = () => (
  <div className='absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-green-500 shadow-lg shadow-green-500/50'>
    <div className='absolute inset-0 h-3 w-3 animate-ping rounded-full bg-green-400' />
  </div>
);

const EmptyState = () => (
  <div className='flex flex-col items-center justify-center space-y-3 py-16'>
    <div className='bg-muted/50 relative flex h-12 w-12 items-center justify-center rounded-full'>
      <Clock className='text-muted-foreground h-6 w-6' />
      <div className='absolute inset-0 animate-pulse rounded-full bg-green-500/10' />
    </div>
    <div className='text-center'>
      <p className='text-foreground text-sm font-medium'>Waiting for events...</p>
      <p className='text-muted-foreground mt-1 text-xs'>Events will appear here in real-time as they occur</p>
    </div>
  </div>
);

const LoadingMoreIndicator = () => (
  <div className='border-border/60 bg-muted/10 flex items-center justify-center border-t py-6'>
    <div className='flex items-center gap-3'>
      <Spinner size='sm' />
      <span className='text-muted-foreground text-sm font-medium'>Loading more events...</span>
    </div>
  </div>
);

const createShowingText = (allEvents: EventLogEntry[], totalCount: number): string => {
  if (totalCount === 0) {
    return 'No events found';
  }

  const loadedCount = allEvents.length;
  const totalFormatted = formatNumber(totalCount);

  if (loadedCount >= totalCount) {
    return `Showing all ${totalFormatted} events`;
  }

  return `Showing ${loadedCount.toLocaleString()} of ${totalFormatted} events`;
};

export function EventLog({ pageSize = DEFAULT_PAGE_SIZE }: EventLogProps) {
  const { startDate, endDate } = useTimeRangeContext();
  const { queryFilters } = useQueryFiltersContext();
  const dashboardId = useDashboardId();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['recentEvents', dashboardId, startDate, endDate, pageSize, queryFilters],
    queryFn: ({ pageParam = 0 }) =>
      fetchRecentEventsAction(dashboardId, startDate, endDate, pageSize, pageParam, queryFilters),
    initialPageParam: 0,
    getNextPageParam: (lastPage: EventLogEntry[], allPages: EventLogEntry[][]) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.length * pageSize;
    },
    refetchInterval: EVENTS_REFRESH_INTERVAL_MS,
  });

  const { data: totalCount = 0 } = useQuery({
    queryKey: ['totalEventCount', dashboardId, startDate, endDate, queryFilters],
    queryFn: () => fetchTotalEventCountAction(dashboardId, startDate, endDate, queryFilters),
    refetchInterval: COUNT_REFRESH_INTERVAL_MS,
  });

  const allEvents: EventLogEntry[] = useMemo(
    () => data?.pages.flatMap((page: EventLogEntry[]) => page) ?? [],
    [data],
  );

  // Intersection Observer ref for automatic loading at halfway point
  const intersectionThreshold = Math.floor(pageSize / 2);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  const lastEventElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();

      if (node) {
        observerRef.current = new IntersectionObserver(observerCallback, {
          threshold: 0.1,
          rootMargin: '100px',
        });
        observerRef.current.observe(node);
      }
    },
    [isLoading, observerCallback],
  );

  const currentCountText = useMemo(() => createShowingText(allEvents, totalCount), [allEvents, totalCount]);

  return (
    <Card className='border-border/50 relative overflow-hidden shadow-sm'>
      <div className='absolute top-0 left-0 h-1 w-full animate-pulse bg-gradient-to-r from-green-500/20 via-green-400/40 to-green-500/20' />

      <CardHeader className='pb-2'>
        <CardTitle className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex min-w-0 items-center gap-3'>
            <div className='bg-muted/50 border-border/30 relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border'>
              <Clock className='text-primary h-4 w-4' />
              <LiveIndicator />
            </div>
            <div className='flex min-w-0 flex-col'>
              <span className='text-lg font-semibold'>Event Log</span>
              <span className='text-muted-foreground text-xs font-normal'>Real-time activity tracking</span>
            </div>
            <div className='ml-2 flex flex-shrink-0 items-center gap-2'></div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className='p-0'>
        <div className='scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent max-h-[32rem] overflow-y-auto'>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center space-y-3 py-16'>
              <Spinner />
              <p className='text-muted-foreground text-sm'>Loading events...</p>
            </div>
          ) : allEvents.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className='divide-border/60 divide-y'>
                {allEvents.map((event: EventLogEntry, index: number) => {
                  const isNearEnd = index >= allEvents.length - intersectionThreshold;

                  return (
                    <EventLogItem
                      key={`${event.timestamp}-${index}`}
                      event={event}
                      isNearEnd={isNearEnd}
                      onRef={lastEventElementRef}
                    />
                  );
                })}
              </div>

              {isFetchingNextPage && <LoadingMoreIndicator />}
            </>
          )}
        </div>

        <div className='border-border/60 border-t pt-3'>
          <div className='text-muted-foreground text-center text-xs font-medium'>{currentCountText}</div>
        </div>
      </CardContent>
    </Card>
  );
}
