// In-memory sliding-window rate limiter, per process (resets on restart — deliberately cheap).
// Timestamps for a key are pruned lazily on each check; a periodic sweep drops keys that have gone
// fully idle so abandoned keys don't accumulate.

const SWEEP_INTERVAL_MS = 5 * 60_000;

export type RateLimitResult = { allowed: boolean; retryAfterMs: number };

export type SlidingWindow = {
  retryAfterMs(key: string, count?: number): number;
  record(key: string, count?: number): void;
};

export function createSlidingWindow(windowMs: number, maxRequests: number): SlidingWindow {
  const windows = new Map<string, number[]>();

  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, timestamps] of windows) {
      if (timestamps.length === 0 || timestamps[timestamps.length - 1]! <= cutoff) {
        windows.delete(key);
      }
    }
  }, SWEEP_INTERVAL_MS).unref();

  function liveTimestamps(key: string, now: number): number[] {
    const cutoff = now - windowMs;

    let timestamps = windows.get(key);
    if (!timestamps) {
      timestamps = [];
      windows.set(key, timestamps);
    }

    const firstValid = timestamps.findIndex((t) => t > cutoff);
    if (firstValid > 0) {
      timestamps.splice(0, firstValid);
    } else if (firstValid === -1) {
      timestamps.length = 0;
    }

    return timestamps;
  }

  return {
    retryAfterMs(key, count = 1) {
      if (count > maxRequests) return Infinity;
      const now = Date.now();
      const timestamps = liveTimestamps(key, now);
      const excess = timestamps.length + count - maxRequests;
      return excess > 0 ? timestamps[excess - 1]! + windowMs - now : 0;
    },
    record(key, count = 1) {
      const now = Date.now();
      liveTimestamps(key, now).push(...Array<number>(count).fill(now));
    },
  };
}

export function createSlidingWindowLimiter(
  windowMs: number,
  maxRequests: number,
): (key: string) => RateLimitResult {
  const slidingWindow = createSlidingWindow(windowMs, maxRequests);

  return function check(key: string): RateLimitResult {
    const retryAfterMs = slidingWindow.retryAfterMs(key);
    if (retryAfterMs > 0) return { allowed: false, retryAfterMs };

    slidingWindow.record(key);
    return { allowed: true, retryAfterMs: 0 };
  };
}
