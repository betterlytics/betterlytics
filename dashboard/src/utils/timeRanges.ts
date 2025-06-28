import { subDays, subMonths } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export type TimeRangeValue = '24h' | '7d' | '28d' | '3mo' | 'custom';
export type TimeGrouping = 'minute' | 'hour' | 'day';

export interface TimeRangePreset {
  label: string;
  value: TimeRangeValue;
  getRange: (userTimezone?: string) => { startDate: Date; endDate: Date };
}

function startOfDayInTimezone(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  const startOfDay = new Date(zonedDate.getFullYear(), zonedDate.getMonth(), zonedDate.getDate(), 0, 0, 0, 0);
  return fromZonedTime(startOfDay, timezone);
}

function endOfDayInTimezone(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  const endOfDay = new Date(zonedDate.getFullYear(), zonedDate.getMonth(), zonedDate.getDate(), 23, 59, 59, 999);
  return fromZonedTime(endOfDay, timezone);
}

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  {
    label: 'Last 24 hours',
    value: '24h',
    getRange: (userTimezone = 'UTC') => {
      const now = new Date();
      const end = endOfDayInTimezone(now, userTimezone);
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 7 days',
    value: '7d',
    getRange: (userTimezone = 'UTC') => {
      const now = new Date();
      const end = endOfDayInTimezone(now, userTimezone);
      const start = startOfDayInTimezone(subDays(now, 6), userTimezone);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 28 days',
    value: '28d',
    getRange: (userTimezone = 'UTC') => {
      const now = new Date();
      const end = endOfDayInTimezone(now, userTimezone);
      const start = startOfDayInTimezone(subDays(now, 27), userTimezone);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 3 months',
    value: '3mo',
    getRange: (userTimezone = 'UTC') => {
      const now = new Date();
      const end = endOfDayInTimezone(now, userTimezone);
      const start = startOfDayInTimezone(subMonths(now, 3), userTimezone);
      return { startDate: start, endDate: end };
    },
  },
];

export function getDateRangeForTimePresets(
  value: Omit<TimeRangeValue, 'custom'>,
  userTimezone?: string,
): {
  startDate: Date;
  endDate: Date;
} {
  const preset = TIME_RANGE_PRESETS.find((p) => p.value === value);
  if (!preset) {
    return TIME_RANGE_PRESETS.find((p) => p.value === '7d')!.getRange(userTimezone);
  }
  return preset.getRange(userTimezone);
}

export function getGroupingForRange(startDate: Date, endDate: Date): TimeGrouping {
  const diff = endDate.getTime() - startDate.getTime();
  if (diff <= 60 * 60 * 1000) return 'minute';
  if (diff <= 24 * 60 * 60 * 1000) return 'hour';
  return 'day';
}

export { startOfDayInTimezone, endOfDayInTimezone };
