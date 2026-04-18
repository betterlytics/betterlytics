'use client';

import { useEffect, useMemo, useState } from 'react';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import type { SessionReplay } from '@/entities/analytics/sessionReplays.entities';
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

export function useSessionManager(): UseSessionManagerReturn {
  const [selectedSession, setSelectedSession] = useState<SessionReplay | null>(null);
  const [sessionIdParam, setSessionIdParam] = useUrlSearchParam('sessionId');
  const { input, options } = useBAQueryParams();

  const sessionQuery = trpc.sessionReplays.list.useInfiniteQuery(
    { ...input, limit: PAGE_SIZE },
    {
      ...options,
      initialCursor: 0,
      getNextPageParam: (lastPage, _allPages, lastPageParam) =>
        lastPage.length < PAGE_SIZE ? undefined : (lastPageParam ?? 0) + PAGE_SIZE,
    },
  );

  const sessions = useMemo(() => sessionQuery.data?.pages.flatMap((page) => page) ?? [], [sessionQuery.data]);

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
