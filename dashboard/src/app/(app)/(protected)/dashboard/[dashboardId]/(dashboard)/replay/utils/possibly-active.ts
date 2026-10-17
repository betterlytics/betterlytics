// Matches the backend's 30 minute session expiry: recording can resume into the same replay
// (navigation or a new page load) until the analytics session itself has expired.
export const POSSIBLY_ACTIVE_WINDOW_MS = 30 * 60_000;
export const POSSIBLY_ACTIVE_RECHECK_MS = 30_000;

export function isPossiblyActive(endedAt: Date, now: number): boolean {
  return now - endedAt.getTime() < POSSIBLY_ACTIVE_WINDOW_MS;
}
