'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { eventWithTime } from '@rrweb/types';
import { buildTimelineMarkers, type TimelineMarker } from '../ReplayTimeline';

function normalizeEvents(events: eventWithTime[]): eventWithTime[] {
  return [...events].sort((a, z) => a.timestamp - z.timestamp);
}

function calcDurationMs(events: eventWithTime[], origin: number): number {
  if (events.length === 0) return 0;
  const lastTimestamp = events[events.length - 1]?.timestamp ?? origin;
  return Math.max(lastTimestamp - origin, 0);
}

export type UseReplayTimelineReturn = {
  timelineMarkers: TimelineMarker[];
  durationMs: number;
  initializeTimeline: (events: eventWithTime[], sessionId: string) => void;
  appendToTimeline: (events: eventWithTime[], sessionId: string) => void;
  reset: () => void;
};

export function useReplayTimeline(): UseReplayTimelineReturn {
  const [timelineMarkers, setTimelineMarkers] = useState<TimelineMarker[]>([]);
  const [durationMs, setDurationMs] = useState(0);
  const originTimestampRef = useRef<number | null>(null);

  const initializeTimeline = useCallback((normalized: eventWithTime[], sessionId: string) => {
    if (normalized.length === 0) return;

    const origin = normalized[0]?.timestamp ?? 0;
    originTimestampRef.current = origin;

    const markers = buildTimelineMarkers(normalized, origin).map((marker, index) => ({
      ...marker,
      id: `initial-${sessionId}-${index}`,
    }));

    setTimelineMarkers(markers);
    setDurationMs(calcDurationMs(normalized, originTimestampRef.current ?? 0));
  }, []);

  const appendToTimeline = useCallback((events: eventWithTime[], sessionId: string) => {
    if (!events.length || !originTimestampRef.current) return;

    const normalized = normalizeEvents(events);
    if (normalized.length === 0) return;

    // Generate markers for new events
    const markers = buildTimelineMarkers(normalized, originTimestampRef.current).map((marker, index) => ({
      ...marker,
      id: `append-${sessionId}-${Date.now()}-${index}`,
    }));

    // Merge and deduplicate markers
    setTimelineMarkers((prev) => {
      const dedupedByTime = new Map<number, TimelineMarker>();
      [...prev, ...markers].forEach((marker) => {
        if (!dedupedByTime.has(marker.timestamp)) {
          dedupedByTime.set(marker.timestamp, marker);
        }
      });
      return Array.from(dedupedByTime.values()).sort((a, b) => a.timestamp - b.timestamp);
    });

    // Recalculate duration from all events
    setDurationMs((prev) => Math.max(prev, calcDurationMs(normalized, originTimestampRef.current ?? 0)));
  }, []);

  const reset = useCallback(() => {
    setTimelineMarkers([]);
    setDurationMs(0);
    originTimestampRef.current = null;
  }, []);

  return {
    timelineMarkers,
    durationMs,
    initializeTimeline,
    appendToTimeline,
    reset,
  };
}
