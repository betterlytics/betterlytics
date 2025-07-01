import { subDays, subMonths, addSeconds } from 'date-fns';
import { createTimezoneHelper } from './timezoneHelpers';

export type TimeRangeValue = '24h' | '7d' | '28d' | '3mo' | 'custom';
export type TimeGrouping = 'minute' | 'hour' | 'day';

export interface TimeRangePreset {
  label: string;
  value: TimeRangeValue;
  getRange: (userTimezone?: string) => { startDate: Date; endDate: Date };
}

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  {
    label: 'Last 24 hours',
    value: '24h',
    getRange: () => {
      const helper = createTimezoneHelper();
      const now = new Date();
      const end = helper.endOfDayInUserTimezone(now);
      const start = helper.startOfDayInUserTimezone(addSeconds(subDays(now, 1), 1));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 7 days',
    value: '7d',
    getRange: () => {
      const helper = createTimezoneHelper();
      const yesterday = subDays(new Date(), 1);
      const end = helper.endOfDayInUserTimezone(yesterday);
      const start = helper.startOfDayInUserTimezone(addSeconds(subDays(yesterday, 6), 1));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 28 days',
    value: '28d',
    getRange: () => {
      const helper = createTimezoneHelper();
      const yesterday = subDays(new Date(), 1);
      const end = helper.endOfDayInUserTimezone(yesterday);
      const start = helper.startOfDayInUserTimezone(addSeconds(subDays(yesterday, 27), 1));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 3 months',
    value: '3mo',
    getRange: () => {
      const helper = createTimezoneHelper();
      const yesterday = subDays(new Date(), 1);
      const end = helper.endOfDayInUserTimezone(yesterday);
      const start = helper.startOfDayInUserTimezone(addSeconds(subMonths(yesterday, 3), 1));
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
