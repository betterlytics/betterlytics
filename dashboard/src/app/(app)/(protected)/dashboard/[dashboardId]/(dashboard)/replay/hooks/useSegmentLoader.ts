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
        throw new Error(response.status === 404 ? 'No segments found for this session' : 'Failed to fetch segments');
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffered = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffered += value;
        let newline = buffered.indexOf('\n');
        while (newline !== -1) {
          const line = buffered.slice(0, newline);
          buffered = buffered.slice(newline + 1);
          if (line) yield JSON.parse(line) as eventWithTime[];
          newline = buffered.indexOf('\n');
        }
      }
      if (buffered.trim()) yield JSON.parse(buffered) as eventWithTime[];
    },
    [dashboardId, abortLoading],
  );

  return { openSegmentStream, abortLoading };
}
