'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchReplaySegmentsAction, fetchSessionReplaysAction } from '@/app/actions/sessionReplays';
import type { ReplaySegmentManifestEntry, SessionReplay } from '@/entities/sessionReplays';
import { ReplayPlayer, type ReplayPlayerHandle } from '@/app/dashboard/[dashboardId]/replay/ReplayPlayer';
import { SessionReplayList } from '@/app/dashboard/[dashboardId]/replay/SessionReplayList';
import {
  ReplayTimeline,
  buildTimelineMarkers,
  type TimelineMarker,
} from '@/app/dashboard/[dashboardId]/replay/ReplayTimeline';
import { Spinner } from '@/components/ui/spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import type { eventWithTime } from '@rrweb/types';

const INITIAL_PREFETCH_CONCURRENCY = 4;

type SessionWithSegments = SessionReplay & {
  manifest: ReplaySegmentManifestEntry[];
};

const calcDurationMs = (events: eventWithTime[]): number => {
  if (events.length === 0) {
    return 0;
  }
  const firstTimestamp = events[0].timestamp;
  const lastTimestamp = events[events.length - 1]?.timestamp ?? firstTimestamp;
  return Math.max(lastTimestamp - firstTimestamp, 0);
};

type Props = {
  dashboardId: string;
};

export default function ReplayClient({ dashboardId }: Props) {
  const [selectedSession, setSelectedSession] = useState<SessionWithSegments | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [error, setError] = useState<string>('');
  const [timelineMarkers, setTimelineMarkers] = useState<TimelineMarker[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [minDurationFilter, setMinDurationFilter] = useState('');

  const playerRef = useRef<ReplayPlayerHandle | null>(null);
  const inFlightController = useRef<AbortController | null>(null);
  const nextSegmentIndex = useRef(0);
  const originTimestampRef = useRef<number | null>(null);

  const { startDate, endDate } = useTimeRangeContext();
  const { queryFilters } = useQueryFiltersContext();

  const sessionQuery = useQuery({
    queryKey: ['session-replays', dashboardId, startDate, endDate, queryFilters],
    queryFn: () => fetchSessionReplaysAction(dashboardId, startDate, endDate),
  });

  useEffect(() => {
    if (!sessionQuery.data || sessionQuery.data.length === 0) {
      setSelectedSession(null);
      return;
    }

    const [first] = sessionQuery.data;
    setSelectedSession((prev) => {
      if (prev && prev.session_id === first.session_id && prev.manifest) {
        return prev;
      }
      return { ...first, manifest: [] };
    });
  }, [sessionQuery.data]);

  useEffect(() => {
    setTimelineMarkers([]);
  }, [selectedSession?.session_id]);

  const resetActiveRequest = useCallback(() => {
    inFlightController.current?.abort();
    inFlightController.current = null;
  }, []);

  const resetPlayerState = useCallback(() => {
    resetActiveRequest();
    playerRef.current?.reset();
    originTimestampRef.current = null;
    nextSegmentIndex.current = 0;
    setTimelineMarkers([]);
    setCurrentTime(0);
    setDurationMs(0);
  }, [resetActiveRequest]);

  const loadSegment = useCallback(async (segment: ReplaySegmentManifestEntry, signal: AbortSignal) => {
    const response = await fetch(segment.url, { signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch segment ${segment.key}`);
    }
    const data = (await response.json()) as eventWithTime[];
    return data;
  }, []);

  const primePlayerWithSegment = useCallback((events: eventWithTime[], session: SessionWithSegments) => {
    const normalized = normalizeEvents(events);
    if (normalized.length === 0) return;
    originTimestampRef.current = normalized[0]?.timestamp ?? null;
    playerRef.current?.loadInitialEvents(normalized);
    const origin = originTimestampRef.current ?? normalized[0]?.timestamp ?? 0;
    const markers = buildTimelineMarkers(normalized, origin).map((marker, index) => ({
      ...marker,
      id: `manifest-${session.session_id}-${index}`,
    }));
    setTimelineMarkers(markers);
    setDurationMs(calcDurationMs(normalized));
  }, []);

  const appendSegmentToPlayer = useCallback((events: eventWithTime[], session: SessionWithSegments) => {
    if (!events.length) {
      return;
    }
    const normalized = normalizeEvents(events);
    if (normalized.length === 0) return;
    playerRef.current?.appendEvents(normalized);
    const origin = originTimestampRef.current ?? normalized[0]?.timestamp ?? 0;
    const markers = buildTimelineMarkers(normalized, origin).map((marker, index) => ({
      ...marker,
      id: `manifest-${session.session_id}-${nextSegmentIndex.current}-${index}`,
    }));
    setTimelineMarkers((prev) => {
      const dedupedByTime = new Map<number, TimelineMarker>();
      [...prev, ...markers].forEach((marker) => {
        if (!dedupedByTime.has(marker.timestamp)) {
          dedupedByTime.set(marker.timestamp, marker);
        }
      });
      return Array.from(dedupedByTime.values()).sort((a, b) => a.timestamp - b.timestamp);
    });
    setDurationMs((prev) => Math.max(prev, calcDurationMs(normalized)));
  }, []);

  const prefetchSegments = useCallback(
    async (session: SessionWithSegments, startIndex: number) => {
      const manifest = session.manifest;
      if (!manifest.length || startIndex >= manifest.length) return;

      const controller = new AbortController();
      inFlightController.current = controller;

      setIsPrefetching(true);
      nextSegmentIndex.current = startIndex;

      try {
        for (let i = startIndex; i < manifest.length; i++) {
          const segment = manifest[i];
          const events = await loadSegment(segment, controller.signal);

          if (!events.length) continue;

          appendSegmentToPlayer(events, session);
          nextSegmentIndex.current += 1;

          if (controller.signal.aborted) break;
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error(error);
          setError(error instanceof Error ? error.message : 'Failed to load all replay segments');
        }
      } finally {
        setIsPrefetching(false);
      }
    },
    [appendSegmentToPlayer, loadSegment],
  );

  const loadSession = useCallback(
    async (session: SessionReplay) => {
      setIsLoadingEvents(true);
      setError('');
      resetPlayerState();

      try {
        const prefix = session.s3_prefix.endsWith('/') ? session.s3_prefix : `${session.s3_prefix}`;
        const manifest = await fetchReplaySegmentsAction(dashboardId, { prefix });

        if (manifest.length === 0) {
          setError('No segments found for this session');
          setSelectedSession({ ...session, manifest: [] });
          return;
        }

        const enrichedSession: SessionWithSegments = { ...session, manifest };
        setSelectedSession(enrichedSession);

        const controller = new AbortController();
        inFlightController.current = controller;

        const [firstSegment, ...rest] = manifest;
        const initialEvents = await loadSegment(firstSegment, controller.signal);

        if (!initialEvents.length) {
          setError('First segment is empty');
          return;
        }

        primePlayerWithSegment(initialEvents, enrichedSession);
        if (rest.length > 0) {
          await prefetchSegments(enrichedSession, 1);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error(error);
          setError(error instanceof Error ? error.message : 'Failed to load session');
        }
      } finally {
        setIsPrefetching(false);
        setIsLoadingEvents(false);
      }
    },
    [dashboardId, loadSegment, prefetchSegments, primePlayerWithSegment, resetPlayerState],
  );

  useEffect(() => {
    if (!selectedSession) {
      return;
    }

    loadSession(selectedSession);

    return () => {
      resetPlayerState();
    };
  }, [loadSession, resetPlayerState, selectedSession?.session_id]);

  const sessions = sessionQuery.data ?? [];

  const effectiveMinDuration = useMemo(() => {
    const parsed = Number.parseInt(minDurationFilter, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  }, [minDurationFilter]);

  const filteredSessions = useMemo(() => {
    if (effectiveMinDuration === 0) {
      return sessions;
    }
    return sessions.filter((session) => session.duration >= effectiveMinDuration);
  }, [effectiveMinDuration, sessions]);

  const timelineContent = useMemo(() => {
    if (!selectedSession) {
      return null;
    }

    return (
      <div className='space-y-3'>
        <ReplayTimeline
          markers={timelineMarkers}
          currentTime={currentTime}
          onJump={(timestamp) => playerRef.current?.seekTo(timestamp)}
        />
        {isPrefetching && <p className='text-muted-foreground text-xs'>Prefetching remaining segments…</p>}
      </div>
    );
  }, [currentTime, durationMs, isPrefetching, selectedSession, timelineMarkers]);

  return (
    <div className='grid w-full gap-6 lg:grid-cols-[320px_1fr] xl:grid-cols-[320px_minmax(0,1fr)]'>
      <div className='flex min-h-0 flex-col'>
        <div className='bg-muted/40 border-border/60 flex h-screen flex-col overflow-hidden rounded-lg border'>
          <div className='bg-muted/60 sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-4 py-3'>
            <label
              htmlFor='min-duration-filter'
              className='text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-tight'
            >
              Min Duration
              <span className='flex items-center gap-1'>
                <input
                  id='min-duration-filter'
                  type='number'
                  min={0}
                  inputMode='numeric'
                  value={minDurationFilter}
                  onChange={(event) => setMinDurationFilter(event.target.value)}
                  placeholder='30'
                  defaultValue='30'
                  className='border-border bg-background focus:border-primary focus:ring-primary text-foreground h-8 w-32 rounded border px-2 py-1 text-xs shadow-sm transition outline-none focus:ring-1'
                />
                <span className='text-muted-foreground text-xs'>s</span>
              </span>
            </label>
            {sessionQuery.isFetching && <Spinner size='sm' />}
          </div>
          <div className='scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent min-h-0 flex-1 overflow-y-auto px-2 py-2'>
            {sessionQuery.isLoading ? (
              <div className='text-muted-foreground flex h-full items-center justify-center rounded-lg border border-dashed p-6 text-sm'>
                <Spinner />
                <span className='ml-2'>Loading sessions...</span>
              </div>
            ) : (
              <SessionReplayList
                sessions={filteredSessions}
                selectedSessionId={selectedSession?.session_id}
                onSelect={loadSession}
              />
            )}
          </div>
        </div>
      </div>

      <div className='flex min-h-0 flex-col space-y-4'>
        <div className='grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_360px]'>
          <div className='overflow-hidden rounded border'>
            <ReplayPlayer ref={playerRef} />
          </div>
          {timelineContent && <div className='flex min-h-0 flex-col'>{timelineContent}</div>}
        </div>
        {error && <p className='text-sm text-red-500'>{error}</p>}
      </div>
    </div>
  );
}

function normalizeEvents(events: eventWithTime[]): eventWithTime[] {
  // sort by timestamp to ensure order
  return [...events].sort((a, b) => a.timestamp - b.timestamp);
}
