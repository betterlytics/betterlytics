'use client';

import { useEffect, useMemo, useState } from 'react';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import type { SessionReplay } from '@/entities/analytics/sessionReplays.entities';
import { useUrlSearchParam } from '@/hooks/use-sync-url-filters';

export type UseSessionManagerReturn = {
  sessions: SessionReplay[];
  selectedSession: SessionReplay | null;
  linkedSession: SessionReplay | null;
  isLinkedSessionNotFound: boolean;
  isLoading: boolean;
  error: string | null;
  selectSession: (session: SessionReplay) => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

const PAGE_SIZE = 20;

export function useSessionManager(): UseSessionManagerReturn {
  const [picked, setPicked] = useState<{ session: SessionReplay; awaitingUrl: boolean } | null>(null);
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

  // A pick shows at once, before the URL catches up
  const pickedSession =
    picked && (picked.awaitingUrl || sessionIdParam === picked.session.session_id) ? picked.session : null;

  useEffect(() => {
    if (picked?.awaitingUrl && sessionIdParam === picked.session.session_id) {
      setPicked({ session: picked.session, awaitingUrl: false });
    }
  }, [picked, sessionIdParam]);

  // A session id in the URL that the user didn't pick from the list came from a link; an empty one is malformed
  const linkedSessionId = !pickedSession && sessionIdParam !== undefined ? sessionIdParam : undefined;
  const hasLinkedSession = linkedSessionId !== undefined;

  const linkedSessionQuery = trpc.sessionReplays.byId.useQuery(
    { dashboardId: input.dashboardId, sessionId: linkedSessionId ?? '' },
    { enabled: hasLinkedSession },
  );

  const listedLinkedSession = hasLinkedSession
    ? sessions.find((s) => s.session_id === linkedSessionId)
    : undefined;
  const linkedSession = hasLinkedSession ? (listedLinkedSession ?? linkedSessionQuery.data ?? null) : null;
  const isLinkedSessionNotFound =
    hasLinkedSession && !listedLinkedSession && linkedSessionQuery.isSuccess && !linkedSessionQuery.data;

  const selectedSession = useMemo(() => {
    if (pickedSession) return sessions.find((s) => s.session_id === pickedSession.session_id) ?? pickedSession;
    if (hasLinkedSession) return linkedSession;
    return sessions[0] ?? null;
  }, [pickedSession, hasLinkedSession, linkedSession, sessions]);

  const selectSession = (session: SessionReplay) => {
    if (selectedSession?.session_id === session.session_id) {
      return;
    }
    setPicked({ session, awaitingUrl: true });
    setSessionIdParam(session.session_id);
  };

  const linkedSessionError = hasLinkedSession && !listedLinkedSession ? linkedSessionQuery.error : null;

  return {
    sessions,
    selectedSession,
    linkedSession,
    isLinkedSessionNotFound,
    isLoading: sessionQuery.isLoading,
    error: (sessionQuery.error ?? linkedSessionError)?.message ?? null,
    selectSession,
    fetchNextPage: () => {
      if (sessionQuery.hasNextPage && !sessionQuery.isFetchingNextPage) void sessionQuery.fetchNextPage();
    },
    hasNextPage: sessionQuery.hasNextPage ?? false,
    isFetchingNextPage: sessionQuery.isFetchingNextPage,
  };
}
