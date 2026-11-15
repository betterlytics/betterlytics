import type { MonitorPausePeriod } from './monitoring.entities';

export function pausesForMonitor(pauses: MonitorPausePeriod[], monitorCheckId: string): MonitorPausePeriod[] {
  return pauses.filter((pause) => pause.monitorCheckId === monitorCheckId);
}

/** Milliseconds of `[startMs, endMs)` the monitor was paused for. Overlapping periods count once. */
export function pausedOverlapMs(pauses: MonitorPausePeriod[], startMs: number, endMs: number): number {
  if (endMs <= startMs) return 0;

  const clipped = pauses
    .map((pause) => [
      Math.max(pause.pausedAt.getTime(), startMs),
      Math.min(pause.resumedAt?.getTime() ?? Infinity, endMs),
    ])
    .filter(([from, to]) => from < to)
    .sort((a, b) => a[0] - b[0]);

  let paused = 0;
  let coveredUntil = startMs;
  for (const [from, to] of clipped) {
    const start = Math.max(from, coveredUntil);
    if (to > start) {
      paused += to - start;
      coveredUntil = to;
    }
  }
  return paused;
}

/** An incident's duration without the time its monitor was paused. */
export function unpausedDurationMs(pauses: MonitorPausePeriod[], startMs: number, endMs: number): number {
  return Math.max(0, endMs - startMs - pausedOverlapMs(pauses, startMs, endMs));
}

/** Paused monitors with no open period recorded: paused before pause times were recorded. */
export function monitorsWithUnrecordedPause(
  monitors: Array<{ id: string; isEnabled: boolean }>,
  recorded: MonitorPausePeriod[],
): string[] {
  return monitors
    .filter(
      (monitor) =>
        !monitor.isEnabled &&
        !recorded.some((pause) => pause.monitorCheckId === monitor.id && pause.resumedAt == null),
    )
    .map((monitor) => monitor.id);
}

/** Adds an open pause from their last recorded check for monitors paused without one recorded. */
export function withUnrecordedPauses(
  monitors: Array<{ id: string; isEnabled: boolean }>,
  recorded: MonitorPausePeriod[],
  lastCheckAt: Record<string, Date | null | undefined>,
): MonitorPausePeriod[] {
  const unrecorded = monitorsWithUnrecordedPause(monitors, recorded).flatMap((monitorCheckId) => {
    const pausedAt = lastCheckAt[monitorCheckId];
    return pausedAt ? [{ monitorCheckId, pausedAt, resumedAt: null }] : [];
  });
  return [...recorded, ...unrecorded];
}
