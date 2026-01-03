'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import { fetchReplaySegmentsAction } from '@/app/actions/analytics/sessionReplays.actions';
import type { ReplaySegmentManifestEntry, SessionReplay } from '@/entities/analytics/sessionReplays.entities';
import type { eventWithTime } from '@rrweb/types';

export type SessionWithSegments = SessionReplay & {
  manifest: ReplaySegmentManifestEntry[];
};

export type UseSegmentLoaderReturn = {
  isLoading: boolean;
  error: string | null;
  loadSession: (session: SessionReplay) => Promise<SessionWithSegments | null>;
  loadSegment: (segment: ReplaySegmentManifestEntry, signal: AbortSignal) => Promise<eventWithTime[]>;
  abortLoading: () => void;
};

export function useSegmentLoader(dashboardId: string): UseSegmentLoaderReturn {
  const [isLoading, startLoadingTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inFlightController = useRef<AbortController | null>(null);

  const abortLoading = useCallback(() => {
    inFlightController.current?.abort();
    inFlightController.current = null;
  }, []);

  const loadSegment = useCallback(async (segment: ReplaySegmentManifestEntry, signal: AbortSignal) => {
    const response = await fetch(segment.url, { signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch segment ${segment.key}`);
    }
    const data = (await response.json()) as eventWithTime[];
    return data;
  }, []);

  const loadSession = useCallback(
    (session: SessionReplay): Promise<SessionWithSegments | null> => {
      return new Promise((resolve) => {
        startLoadingTransition(async () => {
          setError(null);
          abortLoading();

          try {
            const controller = new AbortController();
            inFlightController.current = controller;

            const manifest = await fetchReplaySegmentsAction(dashboardId, {
              prefix: session.s3_prefix,
              cutoffIso: session.ended_at,
            });

            if (controller.signal.aborted) {
              resolve(null);
              return;
            }

            if (manifest.length === 0) {
              setError('No segments found for this session');
              resolve(null);
              return;
            }

            const enrichedSession: SessionWithSegments = { ...session, manifest };
            resolve(enrichedSession);
          } catch (error) {
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
              console.error(error);
              setError(error instanceof Error ? error.message : 'Failed to load session');
            }
            resolve(null);
          }
        });
      });
    },
    [dashboardId, abortLoading],
  );

  return {
    isLoading,
    error,
    loadSession,
    loadSegment,
    abortLoading,
  };
}
