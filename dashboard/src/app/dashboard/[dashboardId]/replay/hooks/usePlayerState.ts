'use client';

import { useCallback, useRef, useTransition, useState } from 'react';
import type { ReplayPlayerHandle } from '@/app/dashboard/[dashboardId]/replay/ReplayPlayer';
import type { eventWithTime } from '@rrweb/types';
import { useSegmentLoader, type SessionWithSegments } from './useSegmentLoader';
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
  setSkippingInactive: (value: boolean) => void;
  loadSession: (session: SessionWithSegments) => Promise<void>;
  jumpTo: (timestamp: number) => void;
  reset: () => void;
};

export function usePlayerState(dashboardId: string): UsePlayerStateReturn {
  const playerRef = useRef<ReplayPlayerHandle | null>(null);
  const [isPrefetching, startPrefetchingTransition] = useTransition();
  const currentSessionIdRef = useRef<string | null>(null);
  const nextSegmentIndex = useRef(0);
  const eventsRef = useRef<eventWithTime[]>([]);
  const [isSkippingInactive, setSkippingInactive] = useState(true);

  const segmentLoader = useSegmentLoader(dashboardId);
  const timeline = useReplayTimeline();

  const loadInitialSegment = useCallback(
    async (session: SessionWithSegments): Promise<void> => {
      if (session.manifest.length === 0) return;
      const controller = new AbortController();
      const firstSegment = session.manifest[0];

      try {
        const initialEvents = await segmentLoader.loadSegment(firstSegment, controller.signal);
        if (controller.signal.aborted || currentSessionIdRef.current !== session.session_id) return;

        if (!initialEvents.length) {
          throw new Error('First segment is empty');
        }

        const normalized = [...initialEvents].sort((a, b) => a.timestamp - b.timestamp);
        eventsRef.current = normalized;
        playerRef.current?.loadInitialEvents(normalized);
        timeline.initializeTimeline(normalized, session.session_id);
        nextSegmentIndex.current = 1;
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          throw error;
        }
      }
    },
    [segmentLoader, timeline.initializeTimeline],
  );

  const prefetchRemainingSegments = useCallback(
    (session: SessionWithSegments) => {
      if (nextSegmentIndex.current >= session.manifest.length) return;

      startPrefetchingTransition(async () => {
        const controller = new AbortController();

        try {
          for (let i = nextSegmentIndex.current; i < session.manifest.length; i++) {
            if (currentSessionIdRef.current !== session.session_id) break;

            const segment = session.manifest[i];
            const events = await segmentLoader.loadSegment(segment, controller.signal);

            if (controller.signal.aborted || currentSessionIdRef.current !== session.session_id) break;
            if (!events.length) continue;

            const normalized = [...events].sort((a, b) => a.timestamp - b.timestamp);
            eventsRef.current = [...eventsRef.current, ...normalized];
            playerRef.current?.appendEvents(normalized);
            timeline.appendToTimeline(normalized, session.session_id);
            nextSegmentIndex.current = i + 1;
          }
        } catch (error) {
          if (!(error instanceof DOMException && error.name === 'AbortError')) {
            console.error('Error prefetching segments:', error);
          }
        }
      });
    },
    [segmentLoader, timeline.appendToTimeline],
  );

  const loadSession = useCallback(
    async (session: SessionWithSegments): Promise<void> => {
      currentSessionIdRef.current = session.session_id;
      nextSegmentIndex.current = 0;

      segmentLoader.abortLoading();
      playerRef.current?.reset();
      timeline.reset();

      await loadInitialSegment(session);

      if (session.manifest.length > 1) {
        prefetchRemainingSegments(session);
      }
    },
    [segmentLoader, timeline.reset, loadInitialSegment, prefetchRemainingSegments],
  );

  const jumpTo = useCallback((timestamp: number) => {
    playerRef.current?.seekTo(timestamp);
  }, []);

  const reset = useCallback(() => {
    segmentLoader.abortLoading();
    playerRef.current?.reset();
    timeline.reset();
    currentSessionIdRef.current = null;
    nextSegmentIndex.current = 0;
    eventsRef.current = [];
  }, [segmentLoader, timeline.reset]);

  return {
    playerRef,
    isLoadingSegments: segmentLoader.isLoading,
    isPrefetching,
    error: segmentLoader.error,
    timelineMarkers: timeline.timelineMarkers,
    durationMs: timeline.durationMs,
    isSkippingInactive,
    setSkippingInactive,
    loadSession,
    jumpTo,
    reset,
    eventsRef,
  };
}
