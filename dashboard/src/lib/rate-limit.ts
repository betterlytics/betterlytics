// In-memory sliding-window rate limiter, per process (resets on restart — deliberately cheap).
// Timestamps for a key are pruned lazily on each check; a periodic sweep drops keys that have gone
// fully idle so abandoned keys don't accumulate.

const SWEEP_INTERVAL_MS = 5 * 60_000;

export type RateLimitResult = { allowed: boolean; retryAfterMs: number };

export function createSlidingWindowLimiter(
  windowMs: number,
  maxRequests: number,
): (key: string) => RateLimitResult {
  const checkAll = createAllOrNothingLimiter(windowMs, maxRequests);
  return (key) => checkAll([key]);
}

// Checks several requests as one unit, where a key that repeats takes one slot per occurrence: either
// every request fits and all are recorded, or none is recorded and retryAfterMs says when they all fit.
export function createAllOrNothingLimiter(
  windowMs: number,
  maxRequests: number,
): (keys: readonly string[]) => RateLimitResult {
  const windows = new Map<string, number[]>();

  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, timestamps] of windows) {
      if (timestamps.length === 0 || timestamps[timestamps.length - 1]! <= cutoff) {
        windows.delete(key);
      }
    }
  }, SWEEP_INTERVAL_MS).unref();

  function liveTimestamps(key: string, cutoff: number): number[] {
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

  return function check(keys: readonly string[]): RateLimitResult {
    const now = Date.now();
    const cutoff = now - windowMs;

    const requested = new Map<string, number>();
    for (const key of keys) {
      requested.set(key, (requested.get(key) ?? 0) + 1);
    }

    let retryAfterMs = 0;
    for (const [key, count] of requested) {
      const timestamps = liveTimestamps(key, cutoff);
      const excess = timestamps.length + count - maxRequests;
      if (excess > 0) {
        // More requests than the limit never fit, so the longest honest answer is a whole window.
        const freesSlotAt = timestamps[excess - 1] ?? now;
        retryAfterMs = Math.max(retryAfterMs, freesSlotAt + windowMs - now);
      }
    }
    if (retryAfterMs > 0) return { allowed: false, retryAfterMs };

    for (const [key, count] of requested) {
      windows.get(key)!.push(...Array<number>(count).fill(now));
    }
    return { allowed: true, retryAfterMs: 0 };
  };
}
