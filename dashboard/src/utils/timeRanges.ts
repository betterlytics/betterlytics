import { subDays, subMonths, subSeconds, subMilliseconds, endOfDay, startOfDay } from 'date-fns';

export type TimeRangeValue = '24h' | '7d' | '28d' | '3mo' | 'custom';
export type TimeGrouping = 'minute' | 'hour' | 'day';

export interface TimeRangePreset {
  label: string;
  value: TimeRangeValue;
  getRange: () => { startDate: Date; endDate: Date };
}

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  {
    label: 'Last 24 hours',
    value: '24h',
    getRange: () => {
      const end = new Date();
      const start = subDays(end, 1);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 7 days',
    value: '7d',
    getRange: () => {
      const now = new Date();
      const end = subSeconds(endOfDay(now), 1);
      const start = startOfDay(subDays(now, 6));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 28 days',
    value: '28d',
    getRange: () => {
      const now = new Date();
      const end = subSeconds(endOfDay(now), 1);
      const start = startOfDay(subDays(now, 27));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 3 months',
    value: '3mo',
    getRange: () => {
      const now = new Date();
      const end = subSeconds(endOfDay(now), 1);
      const start = startOfDay(subMonths(now, 3));
      return { startDate: start, endDate: end };
    },
  },
];

export function getDateRangeForTimePresets(value: Omit<TimeRangeValue, 'custom'>): {
  startDate: Date;
  endDate: Date;
} {
  const preset = TIME_RANGE_PRESETS.find((p) => p.value === value);
  if (!preset) {
    throw Error('Unknown preset');
  }
  return preset.getRange();
}

export function getCompareRangeForTimePresets(value: Omit<TimeRangeValue, 'custom'>) {
  const { startDate, endDate } = getDateRangeForTimePresets(value);

  const durationMs = endDate.getTime() - startDate.getTime();

  const compareEnd = subSeconds(startDate, 1);
  const compareStart = subMilliseconds(startDate, durationMs);

  return {
    compareStart,
    compareEnd,
  };
}
