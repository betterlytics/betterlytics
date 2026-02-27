const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const CLEANUP_INTERVAL_MS = 5 * 60_000;

const windows = new Map<string, number[]>();

export function checkRateLimit(siteId: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  let timestamps = windows.get(siteId);
  if (!timestamps) {
    timestamps = [];
    windows.set(siteId, timestamps);
  }

  const firstValid = timestamps.findIndex((t) => t > cutoff);
  if (firstValid > 0) {
    timestamps.splice(0, firstValid);
  } else if (firstValid === -1) {
    timestamps.length = 0;
  }

  if (timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = timestamps[0]!;
    return { allowed: false, retryAfterMs: oldestInWindow + WINDOW_MS - now };
  }

  timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [key, timestamps] of windows) {
    if (timestamps.length === 0 || timestamps[timestamps.length - 1]! <= cutoff) {
      windows.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref();
