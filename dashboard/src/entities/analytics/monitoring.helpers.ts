export type UptimeTotals = { upSeconds: number; monitoredSeconds: number };

/**
 * The one uptime figure every surface shows: up time over monitored time, pooled across whatever
 * buckets (or monitors) are passed in. Null when none of it was monitored.
 */
export function summarizeUptime(parts: Iterable<UptimeTotals>): UptimeTotals & { percent: number | null } {
  let upSeconds = 0;
  let monitoredSeconds = 0;
  for (const part of parts) {
    upSeconds += part.upSeconds;
    monitoredSeconds += part.monitoredSeconds;
  }
  return {
    upSeconds,
    monitoredSeconds,
    percent: monitoredSeconds > 0 ? (upSeconds / monitoredSeconds) * 100 : null,
  };
}

export function uptimeRatio({ upSeconds, monitoredSeconds }: UptimeTotals): number | null {
  return monitoredSeconds > 0 ? Math.min(1, Math.max(0, upSeconds / monitoredSeconds)) : null;
}
