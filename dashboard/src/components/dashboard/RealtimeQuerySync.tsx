'use client';

import { useEffect, useRef } from 'react';
import { trpc } from '@/trpc/client';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';

const REALTIME_REFRESH_INTERVAL_MS = 30_000;

/**
 * Drives realtime query refreshes from a single shared 30-second interval.
 *
 * On a minute boundary, advances context dates via setPeriod. The key change
 * triggers exactly one natural fetch. On same-minute ticks, calls invalidate()
 * on analytics routers instead. The two are mutually exclusive to prevent the
 * double-fetch that occurs when invalidate() fires while a key-change fetch is
 * already in flight.
 */
export function RealtimeQuerySync() {
  const { interval, setPeriod } = useTimeRangeContext();
  const utils = trpc.useUtils();
  const isRealtime = interval === 'realtime';

  // 0 ensures the first tick always calls setPeriod to sync context dates.
  const prevMinuteEndMsRef = useRef(0);

  useEffect(() => {
    if (!isRealtime) {
      prevMinuteEndMsRef.current = 0;
      return;
    }

    const id = setInterval(() => {
      const currentMinuteEndMs = Math.ceil(Date.now() / 60_000) * 60_000;
      const minuteChanged = currentMinuteEndMs !== prevMinuteEndMsRef.current;
      prevMinuteEndMsRef.current = currentMinuteEndMs;

      if (minuteChanged) {
        setPeriod(new Date(), new Date());
      } else {
        void Promise.all([
          utils.overview.invalidate(),
          utils.geography.invalidate(),
          utils.devices.invalidate(),
          utils.referrers.invalidate(),
          utils.events.invalidate(),
          utils.weeklyHeatmap.invalidate(),
          utils.pages.invalidate(),
          utils.campaign.invalidate(),
          utils.outboundLinks.invalidate(),
          utils.webVitals.invalidate(),
          utils.errors.invalidate(),
          utils.funnels.invalidate(),
          utils.userJourney.invalidate(),
          utils.sessionReplays.invalidate(),
        ]);
      }
    }, REALTIME_REFRESH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [isRealtime, utils, setPeriod]);

  return null;
}
