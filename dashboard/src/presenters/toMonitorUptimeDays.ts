import moment from 'moment-timezone';
import { type MonitorDailyUptime } from '@/entities/analytics/monitoring.entities';
import { summarizeUptime } from '@/entities/analytics/monitoring.helpers';
import { computeDowntimeFromUptimeDays, type DowntimeMetadata } from '@/utils/formatters';

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
  timezone: string,
  totalDays = 180,
  windows: number[] = [7, 30, 90, totalDays],
): PresentedMonitorUptime {
  const grid = buildUptimeGrid(rows, totalDays, timezone);
  const stats = computeUptimeStats(rows, windows, timezone);

  return { grid, stats, totalDays };
}

function buildUptimeGrid(
  days: MonitorDailyUptime[],
  totalDays: number,
  timezone: string,
): PresentedMonitorUptimeCell[] {
  const today = moment.tz(timezone).startOf('day');
  const map = new Map<string, number | null>();

  days.forEach((d) => {
    map.set(d.date, d.upRatio ?? null);
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

// A "last N days" window is N calendar days in the zone, today included, whatever was monitored
function computeUptimeStats(
  days: MonitorDailyUptime[],
  windows: number[],
  timezone: string,
): PresentedMonitorUptimeStat[] {
  const today = moment.tz(timezone).startOf('day');

  return windows.map((w) => {
    const firstDay = today
      .clone()
      .subtract(w - 1, 'days')
      .format('YYYY-MM-DD');
    const { percent, monitoredSeconds } = summarizeUptime(days.filter((d) => d.date >= firstDay));

    return {
      label: `last-${w}-days`,
      windowDays: w,
      percent,
      downtime: percent != null ? computeDowntimeFromUptimeDays(percent, monitoredSeconds / 86400) : null,
    };
  });
}
