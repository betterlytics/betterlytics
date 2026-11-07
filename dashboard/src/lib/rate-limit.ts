// In-memory sliding-window rate limiter, per process (resets on restart — deliberately cheap).
// Timestamps for a key are pruned lazily on each check; a periodic sweep drops keys that have gone
// fully idle so abandoned keys don't accumulate.

const SWEEP_INTERVAL_MS = 5 * 60_000;

export type RateLimitResult = { allowed: boolean; retryAfterMs: number };

export function createSlidingWindowLimiter(
  windowMs: number,
  maxRequests: number,
): (key: string) => RateLimitResult {
  const windows = new Map<string, number[]>();

  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, timestamps] of windows) {
      if (timestamps.length === 0 || timestamps[timestamps.length - 1]! <= cutoff) {
        windows.delete(key);
      }
    }
  }, SWEEP_INTERVAL_MS).unref();

  return function check(key: string): RateLimitResult {
    const now = Date.now();
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

    if (timestamps.length >= maxRequests) {
      const oldestInWindow = timestamps[0]!;
      return { allowed: false, retryAfterMs: oldestInWindow + windowMs - now };
    }

    timestamps.push(now);
    return { allowed: true, retryAfterMs: 0 };
  };
}
