'use client';

import { useCallback, useRef } from 'react';
import type { eventWithTime } from '@rrweb/types';

export type UseSegmentLoaderReturn = {
  openSegmentStream: (sessionId: string) => AsyncGenerator<eventWithTime[]>;
  abortLoading: () => void;
};

export function useSegmentLoader(dashboardId: string): UseSegmentLoaderReturn {
  const inFlightController = useRef<AbortController | null>(null);

  const abortLoading = useCallback(() => {
    inFlightController.current?.abort();
    inFlightController.current = null;
  }, []);

  const openSegmentStream = useCallback(
    async function* (sessionId: string): AsyncGenerator<eventWithTime[]> {
      abortLoading();
      const controller = new AbortController();
      inFlightController.current = controller;

      const response = await fetch(`/api/replay/segments?${new URLSearchParams({ dashboardId, sessionId })}`, {
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(
          response.status === 404 ? 'No segments found for this session' : 'Failed to fetch segments',
        );
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      try {
        let buffered = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffered += value;
          let newline = buffered.indexOf('\n');
          while (newline !== -1) {
            const line = buffered.slice(0, newline);
            buffered = buffered.slice(newline + 1);
            if (line) {
              const events = parseLine(line);
              if (events) yield events;
            }
            newline = buffered.indexOf('\n');
          }
        }
        if (buffered.trim()) {
          const events = parseLine(buffered);
          if (events) yield events;
        }
      } finally {
        // A consumer break must not leave the download running.
        reader.cancel().catch(() => {});
      }
    },
    [dashboardId, abortLoading],
  );

  return { openSegmentStream, abortLoading };
}

// One lost segment instead of a dead session; replay.js never produces such a line,
// so this only fires on hand-crafted uploads.
function parseLine(line: string): eventWithTime[] | null {
  try {
    return JSON.parse(line) as eventWithTime[];
  } catch (error) {
    console.error('Skipping malformed replay segment', error);
    return null;
  }
}
