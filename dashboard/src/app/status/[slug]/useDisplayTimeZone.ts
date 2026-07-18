'use client';

import { useEffect, useState } from 'react';

/**
 * The timezone the public status page should display times in.
 *
 * The page is ISR-cached (one HTML output is shared by every visitor) so the server can't know each
 * visitor's zone and renders in UTC. After hydration this swaps to the visitor's own IANA zone, so
 * times match the clock on their wall. Returning 'UTC' for the first client render keeps it identical
 * to the cached server HTML (no hydration mismatch); the date nodes that flip use
 * `suppressHydrationWarning` to allow the post-mount swap.
 */
export function useDisplayTimeZone(): string {
  const [timeZone, setTimeZone] = useState('UTC');
  useEffect(() => {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolved) setTimeZone(resolved);
  }, []);
  return timeZone;
}
