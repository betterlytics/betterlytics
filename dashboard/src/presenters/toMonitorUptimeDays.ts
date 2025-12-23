import { type MonitorDailyUptime } from '@/entities/analytics/monitoring.entities';
import { formatDowntimeFromUptimeDays } from '@/utils/formatters';

export type PresentedMonitorUptimeDay = {
  date: string;
  upRatio: number | null;
};

export function toMonitorUptimeDays(rows: MonitorDailyUptime[]): PresentedMonitorUptimeDay[] {
  return [...rows]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((row) => ({
      date: row.date,
      upRatio: row.upRatio,
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
  downtime: string | null;
};

export type PresentedMonitorUptime = {
  grid: PresentedMonitorUptimeCell[];
  stats: PresentedMonitorUptimeStat[];
  totalDays: number;
};

export function toMonitorUptimePresentation(
  rows: MonitorDailyUptime[],
  totalDays = 180,
  windows: number[] = [7, 30, 90, totalDays],
): PresentedMonitorUptime {
  const days = toMonitorUptimeDays(rows);
  const grid = buildUptimeGrid(days, totalDays);
  const stats = computeUptimeStats(days, windows);

  return { grid, stats, totalDays };
}

function buildUptimeGrid(days: PresentedMonitorUptimeDay[], totalDays: number): PresentedMonitorUptimeCell[] {
  const today = startOfDay(new Date());
  const map = new Map<number, number | null>();

  days.forEach((d) => {
    const key = startOfDay(new Date(d.date)).getTime();
    map.set(key, d.upRatio ?? null);
  });

  const cells: PresentedMonitorUptimeCell[] = [];
  for (let i = totalDays - 1; i >= 0; i -= 1) {
    const day = startOfDay(addDays(today, -i));
    const key = day.getTime();
    cells.push({
      key: `${key}`,
      date: day.toISOString(),
      upRatio: map.get(key) ?? null,
    });
  }

  return cells;
}

function computeUptimeStats(days: PresentedMonitorUptimeDay[], windows: number[]): PresentedMonitorUptimeStat[] {
  return windows.map((w) => {
    const slice = sliceLastDays(days, w);
    const actualDays = slice.length;
    const percent =
      actualDays > 0 ? (slice.reduce((acc, d) => acc + (d.upRatio ?? 0), 0) / actualDays) * 100 : null;
    return {
      label: `Last ${w} days`,
      windowDays: w,
      percent,
      downtime: percent != null ? formatDowntimeFromUptimeDays(percent, actualDays) : null,
    };
  });
}

function sliceLastDays(days: PresentedMonitorUptimeDay[], count: number) {
  if (!days || days.length === 0) return [];
  const sorted = [...days].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return sorted.slice(-count);
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
