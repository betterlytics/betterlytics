'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import { ReplayControls } from '@/app/dashboard/[dashboardId]/replay/ReplayControls';
import { useReplayControls } from '@/app/dashboard/[dashboardId]/replay/utils/useReplayControls';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import type { eventWithTime } from '@rrweb/types';
import { useUrlSearchParam } from '@/hooks/use-sync-url-filters';

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

  const playerRef = useRef<ReplayPlayerHandle | null>(null);
  const inFlightController = useRef<AbortController | null>(null);
  const nextSegmentIndex = useRef(0);
  const originTimestampRef = useRef<number | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const { startDate, endDate } = useTimeRangeContext();
  const { queryFilters } = useQueryFiltersContext();

  const sessionQuery = useQuery({
    queryKey: ['session-replays', dashboardId, startDate, endDate, queryFilters],
    queryFn: () => fetchSessionReplaysAction(dashboardId, startDate, endDate),
  });
  const sessions = sessionQuery.data ?? [];
  const [sessionIdParam, setSessionIdParam] = useUrlSearchParam('sessionId');

  const controls = useReplayControls(playerRef);

  useEffect(() => {
    const sessions = sessionQuery.data ?? [];
    if (sessions.length === 0) {
      setSelectedSession(null);
      return;
    }

    const chosen =
      (sessionIdParam ? sessions.find((s) => s.session_id === sessionIdParam) : undefined) ?? sessions[0];

    setSelectedSession((prev) => {
      if (prev && prev.session_id === chosen.session_id && prev.manifest) {
        return prev;
      }
      return { ...chosen, manifest: [] } as SessionWithSegments;
    });
  }, [sessionIdParam, sessionQuery.data]);

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
    controls.resetUiState();
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
    if (currentSessionIdRef.current !== session.session_id) return;
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
    if (currentSessionIdRef.current !== session.session_id) return;
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
    setDurationMs((prev) => {
      const origin = originTimestampRef.current ?? normalized[0]?.timestamp ?? 0;
      const lastTs = normalized[normalized.length - 1]?.timestamp ?? origin;
      const totalDuration = Math.max(0, lastTs - origin);
      return Math.max(prev, totalDuration);
    });
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
          if (controller.signal.aborted) break;

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
      currentSessionIdRef.current = session.session_id;
      resetPlayerState();

      try {
        const manifest = await fetchReplaySegmentsAction(dashboardId, { prefix: session.s3_prefix });

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

        if (controller.signal.aborted) return;

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

  useEffect(() => {
    controls.setDurationMs(durationMs);
  }, [durationMs]);
  useEffect(() => {
    controls.setCurrentTime(currentTime);
  }, [currentTime]);

  const handleJump = useCallback((timestamp: number) => playerRef.current?.seekTo(timestamp), []);

  return (
    <div className='grid min-h-0 w-full gap-6 lg:grid-cols-[320px_minmax(0,1fr)_320px] xl:grid-cols-[320px_minmax(0,1fr)_360px]'>
      <div className='min-h-0'>
        <SessionReplayList
          sessions={sessions}
          selectedSessionId={selectedSession?.session_id}
          onSelect={(session) => {
            setSessionIdParam(session.session_id);
            resetPlayerState();
            setSelectedSession({ ...session, manifest: [] });
          }}
        />
      </div>

      <div className='bg-background rr-block relative flex min-h-0 flex-col overflow-hidden rounded-lg border shadow-sm lg:aspect-video'>
        <ReplayPlayer ref={playerRef} />
        <ReplayControls
          isPlaying={controls.isPlaying}
          currentTime={controls.currentTime}
          durationMs={controls.durationMs}
          speed={controls.speed}
          onTogglePlay={controls.playPause}
          onSeekRatio={controls.seekToRatio}
          onSpeedChange={controls.setSpeed}
          markers={timelineMarkers}
          className='absolute inset-x-0 bottom-0'
        />
        {error && <p className='text-sm text-red-500'>{error}</p>}
      </div>

      <div className='min-h-0'>
        <ReplayTimeline markers={timelineMarkers} onJump={handleJump} />
        {isPrefetching && <p className='text-muted-foreground px-1 text-xs'>Prefetching remaining segments…</p>}
      </div>
    </div>
  );
}

function normalizeEvents(events: eventWithTime[]): eventWithTime[] {
  // sort by timestamp to ensure order
  return [...events].sort((a, b) => a.timestamp - b.timestamp);
}
