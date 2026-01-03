'use client';

import { useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchSessionReplaysAction } from '@/app/actions/analytics/sessionReplays.actions';
import type { SessionReplay } from '@/entities/analytics/sessionReplays.entities';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { useUrlSearchParam } from '@/hooks/use-sync-url-filters';

export type UseSessionManagerReturn = {
  sessions: SessionReplay[];
  selectedSession: SessionReplay | null;
  isLoading: boolean;
  error: string | null;
  selectSession: (session: SessionReplay) => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

const PAGE_SIZE = 20;

export function useSessionManager(dashboardId: string): UseSessionManagerReturn {
  const [selectedSession, setSelectedSession] = useState<SessionReplay | null>(null);
  const { startDate, endDate } = useTimeRangeContext();
  const { queryFilters } = useQueryFiltersContext();
  const [sessionIdParam, setSessionIdParam] = useUrlSearchParam('sessionId');

  const sessionQuery = useInfiniteQuery({
    queryKey: ['session-replays', dashboardId, startDate, endDate, PAGE_SIZE, queryFilters],
    queryFn: ({ pageParam = 0 }) =>
      fetchSessionReplaysAction(dashboardId, startDate, endDate, PAGE_SIZE, pageParam, queryFilters),
    initialPageParam: 0,
    getNextPageParam: (lastPage: SessionReplay[], allPages: SessionReplay[][]) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
  });

  const sessions = useMemo(
    () => sessionQuery.data?.pages.flatMap((page: SessionReplay[]) => page) ?? [],
    [sessionQuery.data],
  );

  useEffect(() => {
    if (sessions.length === 0) {
      setSelectedSession(null);
      return;
    }

    const chosen =
      (sessionIdParam ? sessions.find((s) => s.session_id === sessionIdParam) : undefined) ?? sessions[0];

    setSelectedSession((prev) => {
      if (prev?.session_id === chosen.session_id) {
        return prev;
      }
      return chosen;
    });
  }, [sessionIdParam, sessions]);

  const selectSession = (session: SessionReplay) => {
    if (selectedSession?.session_id === session.session_id) {
      return;
    }
    setSessionIdParam(session.session_id);
    setSelectedSession(session);
  };

  return {
    sessions,
    selectedSession,
    isLoading: sessionQuery.isLoading,
    error: (sessionQuery.error as Error | null)?.message ?? null,
    selectSession,
    fetchNextPage: () => {
      if (sessionQuery.hasNextPage && !sessionQuery.isFetchingNextPage) void sessionQuery.fetchNextPage();
    },
    hasNextPage: sessionQuery.hasNextPage ?? false,
    isFetchingNextPage: sessionQuery.isFetchingNextPage,
  };
}
