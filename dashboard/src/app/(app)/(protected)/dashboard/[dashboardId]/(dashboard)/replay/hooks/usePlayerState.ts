'use client';

import { useCallback, useRef, useState } from 'react';
import type { ReplayPlayerHandle } from '../ReplayPlayer';
import type { eventWithTime } from '@rrweb/types';
import type { SessionReplay } from '@/entities/analytics/sessionReplays.entities';
import { useSegmentLoader } from './useSegmentLoader';
import { useReplayTimeline } from './useReplayTimeline';

export type UsePlayerStateReturn = {
  playerRef: React.RefObject<ReplayPlayerHandle | null>;
  isLoadingSegments: boolean;
  isPrefetching: boolean;
  error: string | null;
  timelineMarkers: ReturnType<typeof useReplayTimeline>['timelineMarkers'];
  durationMs: number;
  eventsRef: React.RefObject<eventWithTime[]>;
  isSkippingInactive: boolean;
  inactivitiesRef: React.RefObject<InactivityPeriod[]>;
  setSkippingInactive: (value: boolean) => void;
  loadSession: (session: SessionReplay) => Promise<void>;
  jumpTo: (timestamp: number) => void;
  reset: () => void;
};

export function usePlayerState(dashboardId: string): UsePlayerStateReturn {
  const playerRef = useRef<ReplayPlayerHandle | null>(null);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const eventsRef = useRef<eventWithTime[]>([]);
  const [isSkippingInactive, setSkippingInactive] = useState(true);
  const inactivitiesRef = useRef<InactivityPeriod[]>([]);

  const segmentLoader = useSegmentLoader(dashboardId);
  const timeline = useReplayTimeline();

  const loadSession = useCallback(
    async (session: SessionReplay): Promise<void> => {
      currentSessionIdRef.current = session.session_id;
      segmentLoader.abortLoading();
      playerRef.current?.reset();
      timeline.reset();
      setError(null);
      setIsLoadingSegments(true);

      try {
        let initialized = false;
        for await (const events of segmentLoader.openSegmentStream(session.session_id)) {
          if (currentSessionIdRef.current !== session.session_id) break;
          if (!events.length) continue;

          const normalized = [...events].sort((a, b) => a.timestamp - b.timestamp);
          if (!initialized) {
            eventsRef.current = normalized;
            playerRef.current?.loadInitialEvents(normalized);
            timeline.initializeTimeline(normalized, session.session_id);
            initialized = true;
            setIsLoadingSegments(false);
            setIsPrefetching(true);
          } else {
            eventsRef.current = [...eventsRef.current, ...normalized];
            playerRef.current?.appendEvents(normalized);
            timeline.appendToTimeline(normalized, session.session_id);
          }
        }
        if (!initialized) throw new Error('First segment is empty');
        inactivitiesRef.current = getInactivityPeriods(eventsRef.current);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error(error);
          setError(error instanceof Error ? error.message : 'Failed to load session');
        }
      } finally {
        if (currentSessionIdRef.current === session.session_id) {
          setIsLoadingSegments(false);
          setIsPrefetching(false);
        }
      }
    },
    [segmentLoader, timeline.reset, timeline.initializeTimeline, timeline.appendToTimeline],
  );

  const jumpTo = useCallback((timestamp: number) => {
    playerRef.current?.seekTo(timestamp);
  }, []);

  const reset = useCallback(() => {
    segmentLoader.abortLoading();
    playerRef.current?.reset();
    timeline.reset();
    currentSessionIdRef.current = null;
    eventsRef.current = [];
    inactivitiesRef.current = [];
  }, [segmentLoader, timeline.reset]);

  return {
    playerRef,
    isLoadingSegments,
    isPrefetching,
    error,
    timelineMarkers: timeline.timelineMarkers,
    durationMs: timeline.durationMs,
    isSkippingInactive,
    setSkippingInactive,
    inactivitiesRef,
    loadSession,
    jumpTo,
    reset,
    eventsRef,
  };
}

// Unused but intended to be used in future for more robust inactivity handling
type InactivityPeriod = {
  start: number;
  end: number;
};

function getInactivityPeriods(events: eventWithTime[]) {
  if (!events || events.length === 0) return [];

  const inactivities: InactivityPeriod[] = [];

  const inactivityThreshold = 8000;
  for (let i = 0; i < events.length - 1; i++) {
    const currentEvent = events[i];
    const nextEvent = events[i + 1];

    if (nextEvent.timestamp - currentEvent.timestamp >= inactivityThreshold) {
      inactivities.push({
        start: currentEvent.timestamp,
        end: nextEvent.timestamp,
      });
    }
  }

  return inactivities;
}
