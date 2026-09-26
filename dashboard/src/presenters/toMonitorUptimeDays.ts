import moment from 'moment-timezone';
import { type MonitorDailyUptime } from '@/entities/analytics/monitoring.entities';
import { computeDowntimeFromUptimeDays, type DowntimeMetadata } from '@/utils/formatters';

export type PresentedMonitorUptimeDay = {
  date: string;
  upRatio: number | null;
  totalSeconds: number | null;
};

export function toMonitorUptimeDays(rows: MonitorDailyUptime[]): PresentedMonitorUptimeDay[] {
  return [...rows]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((row) => ({
      date: row.date,
      upRatio: row.upRatio,
      totalSeconds: row.totalSeconds,
    }));
}

export type PresentedMonitorUptimeCell = {
  key: string;
  date: string; // ISO string
  upRatio: number | null;
};

export type PresentedMonitorUptimeStat = {
  label: string;
  windowDays: number;
  percent: number | null;
  downtime: DowntimeMetadata | null;
};

export type PresentedMonitorUptime = {
  grid: PresentedMonitorUptimeCell[];
  stats: PresentedMonitorUptimeStat[];
  totalDays: number;
};

export function toMonitorUptimePresentation(
  rows: MonitorDailyUptime[],
  totalDays = 180,
  timezone: string,
  windows: number[] = [7, 30, 90, totalDays],
): PresentedMonitorUptime {
  const days = toMonitorUptimeDays(rows);
  const grid = buildUptimeGrid(days, totalDays, timezone);
  const stats = computeUptimeStats(days, windows);

  return { grid, stats, totalDays };
}

function buildUptimeGrid(
  days: PresentedMonitorUptimeDay[],
  totalDays: number,
  timezone: string,
): PresentedMonitorUptimeCell[] {
  const today = moment.tz(timezone).startOf('day');
  const map = new Map<string, number | null>();

  // ClickHouse prints the zone's day bucket as its wall clock, so the date part is the zone calendar day
  days.forEach((d) => {
    map.set(d.date.slice(0, 10), d.upRatio ?? null);
  });

  const cells: PresentedMonitorUptimeCell[] = [];
  for (let i = totalDays - 1; i >= 0; i -= 1) {
    const day = today.clone().subtract(i, 'days');
    cells.push({
      key: `${day.valueOf()}`,
      date: day.toISOString(),
      upRatio: map.get(day.format('YYYY-MM-DD')) ?? null,
    });
  }

  return cells;
}

function computeUptimeStats(days: PresentedMonitorUptimeDay[], windows: number[]): PresentedMonitorUptimeStat[] {
  return windows.map((w) => {
    const slice = sliceLastDays(days, w);
    const totalSeconds = slice.reduce((acc, d) => acc + (d.totalSeconds ?? 0), 0);
    const uptimeSeconds = slice.reduce((acc, d) => acc + (d.upRatio ?? 0) * (d.totalSeconds ?? 0), 0);

    const percent = totalSeconds > 0 ? (uptimeSeconds / totalSeconds) * 100 : null;
    return {
      label: `last-${w}-days`,
      windowDays: w,
      percent,
      downtime: percent != null ? computeDowntimeFromUptimeDays(percent, totalSeconds / 86400) : null,
    };
  });
}

function sliceLastDays(days: PresentedMonitorUptimeDay[], count: number) {
  if (!days || days.length === 0) return [];
  const sorted = [...days].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return sorted.slice(-count);
}
