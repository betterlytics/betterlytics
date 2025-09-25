'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchReplaySegmentsAction, fetchSessionReplaysAction } from '@/app/actions/sessionReplays';
import { SessionReplay } from '@/entities/sessionReplays';
import { ReplayPlayer } from '@/components/replay/ReplayPlayer';
import { SessionReplayList } from '@/components/replay/SessionReplayList';
import { Spinner } from '@/components/ui/spinner';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';

type Props = {
  dashboardId: string;
};

export default function ReplayClient({ dashboardId }: Props) {
  const [selectedSession, setSelectedSession] = useState<SessionReplay | null>(null);
  const [events, setEvents] = useState<unknown[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [error, setError] = useState<string>('');
  const { startDate, endDate } = useTimeRangeContext();
  const { queryFilters } = useQueryFiltersContext();

  const sessionQuery = useQuery({
    queryKey: ['session-replays', dashboardId, startDate, endDate, queryFilters],
    queryFn: () => fetchSessionReplaysAction(dashboardId, startDate, endDate),
  });

  useEffect(() => {
    if (sessionQuery.data && sessionQuery.data.length > 0) {
      setSelectedSession(sessionQuery.data[0]);
    } else {
      setSelectedSession(null);
    }
  }, [sessionQuery.data]);

  useEffect(() => {
    setEvents([]);
  }, [selectedSession?.session_id]);

  const loadSession = useCallback(async (session: SessionReplay) => {
    setIsLoadingEvents(true);
    setError('');
    setSelectedSession(session);
    try {
      const prefix = session.s3_prefix.endsWith('/') ? session.s3_prefix : `${session.s3_prefix}`;

      const segments = await fetchReplaySegmentsAction(dashboardId, { prefix });

      const segmentData = await Promise.all(
        segments.map(async (segment) => {
          const segResp = await fetch(segment.url);
          if (!segResp.ok) {
            throw new Error('Failed to download segment');
          }
          return (await segResp.json()) as unknown[];
        }),
      );

      const merged = segmentData.flat();

      if (merged.length === 0) {
        setError('No segments found for this session');
        setEvents([]);
      } else {
        setEvents(merged);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadSession(selectedSession);
    }
  }, [selectedSession, loadSession]);

  const sessions = sessionQuery.data ?? [];

  return (
    <div className='grid w-full gap-6 lg:grid-cols-[320px_1fr]'>
      <div className='flex flex-col'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Sessions</h2>
          {sessionQuery.isFetching && <Spinner size='sm' />}
        </div>
        {sessionQuery.isLoading ? (
          <div className='text-muted-foreground flex flex-1 items-center justify-center rounded-lg border border-dashed p-6 text-sm'>
            <Spinner />
            <span className='ml-2'>Loading sessions...</span>
          </div>
        ) : (
          <SessionReplayList
            sessions={sessions}
            selectedSessionId={selectedSession?.session_id}
            onSelect={loadSession}
          />
        )}
      </div>

      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Replay</h2>
          {isLoadingEvents && <Spinner size='sm' />}
        </div>
        <div className='overflow-hidden rounded border'>
          {events.length > 0 ? (
            <ReplayPlayer events={events} />
          ) : (
            <div className='bg-muted/10 text-muted-foreground flex h-[480px] items-center justify-center text-sm'>
              {isLoadingEvents ? 'Loading replay...' : 'Select a session to view the replay'}
            </div>
          )}
        </div>
        {error && <p className='text-sm text-red-500'>{error}</p>}
      </div>
    </div>
  );
}
