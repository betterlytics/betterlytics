import { subDays, subMonths } from 'date-fns';
import { createTimezoneHelper, UTCDate } from './timezoneHelpers';

export type TimeRangeValue = '24h' | '7d' | '28d' | '3mo' | 'custom';
export type TimeGrouping = 'minute' | 'hour' | 'day';

export interface TimeRangePreset {
  label: string;
  value: TimeRangeValue;
  getRange: (userTimezone?: string) => { startDate: UTCDate; endDate: UTCDate };
}

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  {
    label: 'Last 24 hours',
    value: '24h',
    getRange: (userTimezone = 'UTC') => {
      const now = new Date() as UTCDate;
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000) as UTCDate;
      return { startDate: start, endDate: now };
    },
  },
  {
    label: 'Last 7 days',
    value: '7d',
    getRange: (userTimezone = 'UTC') => {
      const helper = createTimezoneHelper(userTimezone);
      const yesterday = subDays(new Date(), 1) as UTCDate;
      const end = helper.endOfDayInUserTimezone(yesterday);
      const start = helper.startOfDayInUserTimezone(subDays(yesterday, 6));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 28 days',
    value: '28d',
    getRange: (userTimezone = 'UTC') => {
      const helper = createTimezoneHelper(userTimezone);
      const yesterday = subDays(new Date(), 1) as UTCDate;
      const end = helper.endOfDayInUserTimezone(yesterday);
      const start = helper.startOfDayInUserTimezone(subDays(yesterday, 27));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 3 months',
    value: '3mo',
    getRange: (userTimezone = 'UTC') => {
      const helper = createTimezoneHelper(userTimezone);
      const yesterday = subDays(new Date(), 1) as UTCDate;
      const end = helper.endOfDayInUserTimezone(yesterday);
      const start = helper.startOfDayInUserTimezone(subMonths(yesterday, 3));
      return { startDate: start, endDate: end };
    },
  },
];

export function getDateRangeForTimePresets(
  value: Omit<TimeRangeValue, 'custom'>,
  userTimezone?: string,
): {
  startDate: UTCDate;
  endDate: UTCDate;
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
