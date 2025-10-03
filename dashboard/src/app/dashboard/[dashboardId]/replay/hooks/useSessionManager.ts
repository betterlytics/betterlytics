'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSessionReplaysAction } from '@/app/actions/sessionReplays';
import type { SessionReplay } from '@/entities/sessionReplays';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { useUrlSearchParam } from '@/hooks/use-sync-url-filters';

export type UseSessionManagerReturn = {
  sessions: SessionReplay[];
  selectedSession: SessionReplay | null;
  isLoading: boolean;
  error: string | null;
  selectSession: (session: SessionReplay) => void;
};

export function useSessionManager(dashboardId: string): UseSessionManagerReturn {
  const [selectedSession, setSelectedSession] = useState<SessionReplay | null>(null);
  const { startDate, endDate } = useTimeRangeContext();
  const { queryFilters } = useQueryFiltersContext();
  const [sessionIdParam, setSessionIdParam] = useUrlSearchParam('sessionId');

  const sessionQuery = useQuery({
    queryKey: ['session-replays', dashboardId, startDate, endDate, queryFilters],
    queryFn: () => fetchSessionReplaysAction(dashboardId, startDate, endDate),
  });

  const sessions = sessionQuery.data ?? [];

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
    setSessionIdParam(session.session_id);
    setSelectedSession(session);
  };

  return {
    sessions,
    selectedSession,
    isLoading: sessionQuery.isLoading,
    error: sessionQuery.error?.message ?? null,
    selectSession,
  };
}