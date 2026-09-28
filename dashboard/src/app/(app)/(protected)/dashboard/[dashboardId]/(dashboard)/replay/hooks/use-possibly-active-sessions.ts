'use client';

import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { trpc } from '@/trpc/client';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { SESSION_REPLAY_ACTIVITY_MAX_IDS, type SessionReplay } from '@/entities/analytics/sessionReplays.entities';
import {
  isPossiblyActive,
  POSSIBLY_ACTIVE_RECHECK_MS,
} from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/replay/utils/possibly-active';
import { useNow } from './use-now';

export function usePossiblyActiveSessions(sessions: SessionReplay[]): Set<string> {
  const dashboardId = useDashboardId();
  const now = useNow(POSSIBLY_ACTIVE_RECHECK_MS);
  const [polledEndedAt, setPolledEndedAt] = useState<Map<string, Date>>(() => new Map());

  const activeIds = useMemo(
    () =>
      sessions
        .filter((s) => {
          const polled = polledEndedAt.get(s.session_id);
          const endedAt = polled && polled > s.ended_at ? polled : s.ended_at;
          return isPossiblyActive(endedAt, now);
        })
        .map((s) => s.session_id),
    [sessions, polledEndedAt, now],
  );

  const pollIds = useMemo(() => activeIds.slice(0, SESSION_REPLAY_ACTIVITY_MAX_IDS), [activeIds]);

  const activity = trpc.sessionReplays.activity.useQuery(
    { dashboardId, sessionIds: pollIds },
    {
      enabled: pollIds.length > 0,
      refetchInterval: POSSIBLY_ACTIVE_RECHECK_MS,
      placeholderData: keepPreviousData,
    },
  );

  useEffect(() => {
    if (!activity.data) return;
    setPolledEndedAt((prev) => {
      const newer = activity.data.filter((row) => {
        const known = prev.get(row.session_id);
        return !known || row.ended_at > known;
      });
      if (newer.length === 0) return prev;
      const next = new Map(prev);
      newer.forEach((row) => next.set(row.session_id, row.ended_at));
      return next;
    });
  }, [activity.data]);

  return useMemo(() => new Set(activeIds), [activeIds]);
}
