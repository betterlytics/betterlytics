import { subDays, subMonths, startOfDay, endOfDay } from 'date-fns';

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
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 7 days',
    value: '7d',
    getRange: () => {
      const end = endOfDay(new Date());
      const start = startOfDay(subDays(end, 6));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 28 days',
    value: '28d',
    getRange: () => {
      const end = endOfDay(new Date());
      const start = startOfDay(subDays(end, 27));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 3 months',
    value: '3mo',
    getRange: () => {
      const end = endOfDay(new Date());
      const start = startOfDay(subMonths(end, 3));
      return { startDate: start, endDate: end };
    },
  },
];

export function getDateRangeForTimePresets(value: Omit<TimeRangeValue, 'custom'>): { startDate: Date; endDate: Date } {
  const preset = TIME_RANGE_PRESETS.find(p => p.value === value);
  if (!preset) {
    return TIME_RANGE_PRESETS.find(p => p.value === '7d')!.getRange();
  }
  return preset.getRange();
}

export function getGroupingForRange(startDate: Date, endDate: Date): TimeGrouping {
  const diff = endDate.getTime() - startDate.getTime();
  if (diff <= 60 * 60 * 1000) return 'minute';
  if (diff <= 24 * 60 * 60 * 1000) return 'hour';
  return 'day';
} 