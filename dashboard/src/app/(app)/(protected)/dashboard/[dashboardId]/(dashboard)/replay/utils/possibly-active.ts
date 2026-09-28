export const POSSIBLY_ACTIVE_WINDOW_MS = 5 * 60_000;
export const POSSIBLY_ACTIVE_RECHECK_MS = 30_000;

export function isPossiblyActive(endedAt: Date, now: number): boolean {
  return now - endedAt.getTime() < POSSIBLY_ACTIVE_WINDOW_MS;
}
