import {
  subDays,
  subMonths,
  subSeconds,
  endOfDay,
  startOfDay,
  endOfHour,
  startOfHour,
  roundToNearestMinutes,
  startOfMonth,
  endOfMonth,
  subHours,
  startOfYear,
  subMinutes,
  endOfMinute,
  addHours,
} from 'date-fns';
import { GranularityRangeValues, getMinuteStep } from './granularityRanges';

export const TIME_RANGE_VALUES = [
  // fast/short ranges
  'realtime',
  'today',
  'yesterday',
  '1h',
  // week-ish ranges
  '24h',
  '7d',
  '28d',
  '90d',
  // month/quarter/half/year ranges
  'mtd',
  'last_month',
  'ytd',
  '1y',
  'custom',
] as const;
export type TimeRangeValue = (typeof TIME_RANGE_VALUES)[number];

export interface TimeRangePreset {
  label: string;
  value: TimeRangeValue;
  getRange: () => { startDate: Date; endDate: Date };
}

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  // Short ranges
  {
    label: 'Realtime',
    value: 'realtime',
    getRange: () => {
      const end = endOfMinute(new Date());
      const start = subMinutes(end, 30);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Today',
    value: 'today',
    getRange: () => {
      const now = new Date();
      const start = startOfDay(now);
      const end = endOfDay(now);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Yesterday',
    value: 'yesterday',
    getRange: () => {
      const now = new Date();
      const start = startOfDay(subDays(now, 1));
      const end = endOfDay(subDays(now, 1));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Past Hour',
    value: '1h',
    getRange: () => {
      const end = new Date();
      const start = subHours(end, 1);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Past 24 Hours',
    value: '24h',
    getRange: () => {
      const end = new Date();
      const start = subDays(end, 1);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 7 Days',
    value: '7d',
    getRange: () => {
      const end = new Date();
      const start = subDays(end, 7);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 28 Days',
    value: '28d',
    getRange: () => {
      const end = new Date();
      const start = subDays(end, 28);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 90 days',
    value: '90d',
    getRange: () => {
      const end = new Date();
      const start = subDays(end, 90);
      return { startDate: start, endDate: end };
    },
  },
  // Month/Quarter/Year collections
  {
    label: 'Month to Date',
    value: 'mtd',
    getRange: () => {
      const end = endOfDay(new Date());
      const start = startOfMonth(end);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last Month',
    value: 'last_month',
    getRange: () => {
      const now = new Date();
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const end = lastMonthEnd;
      const start = startOfMonth(subMonths(now, 1));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Year to Date',
    value: 'ytd',
    getRange: () => {
      const now = new Date();
      const start = startOfYear(now);
      const end = endOfDay(now);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Past Year',
    value: '1y',
    getRange: () => {
      const now = new Date();
      const end = endOfDay(now);
      const start = startOfDay(subMonths(now, 12));
      return { startDate: start, endDate: end };
    },
  },
];

export function getDateWithTimeOfDay(date: Date, timeOfDayDate: Date) {
  const hours = timeOfDayDate.getHours();
  const minutes = timeOfDayDate.getMinutes();
  const seconds = timeOfDayDate.getSeconds();
  const milliseconds = timeOfDayDate.getMilliseconds();

  const newDate = new Date(date);

  newDate.setHours(hours, minutes, seconds, milliseconds);

  return newDate;
}

export function getStartDateWithGranularity(date: Date, granularity: GranularityRangeValues) {
  const alignedDate = roundToNearestMinutes(date);

  if (granularity === 'day') return startOfDay(alignedDate);
  if (granularity === 'hour') return startOfHour(alignedDate);
  const nearestTo = getMinuteStep(granularity);
  return roundToNearestMinutes(alignedDate, { nearestTo, roundingMethod: 'ceil' });
}

export function getEndDateWithGranularity(date: Date, granularity: GranularityRangeValues) {
  const alignedDate = roundToNearestMinutes(date);

  if (granularity === 'day') return subDays(endOfDay(alignedDate), 1);
  if (granularity === 'hour') return subSeconds(startOfHour(addHours(date, 1)), 1);

  const nearestTo = getMinuteStep(granularity);
  return subSeconds(roundToNearestMinutes(alignedDate, { nearestTo, roundingMethod: 'ceil' }), 1);
}

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
