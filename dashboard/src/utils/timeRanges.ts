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
  endOfYear,
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
  '3d',
  '7d',
  '14d',
  '30d',
  // month/quarter/half/year ranges
  'mtd',
  'last_month',
  'qtd',
  '3mo',
  '6mo',
  'ytd',
  '1y',
  'custom',
] as const;
export type TimeRangeValue = (typeof TIME_RANGE_VALUES)[number];
export type TimeGrouping = 'minute' | 'hour' | 'day';

export interface TimeRangePreset {
  label: string;
  value: TimeRangeValue;
  getRange: () => { startDate: Date; endDate: Date };
}

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  // Short ranges
  {
    label: 'Real-time',
    value: 'realtime',
    getRange: () => {
      const now = new Date();
      const start = startOfHour(now);
      const end = subSeconds(endOfHour(now), 1);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Today',
    value: 'today',
    getRange: () => {
      const now = new Date();
      const start = startOfDay(now);
      const end = subSeconds(endOfDay(now), 1);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Yesterday',
    value: 'yesterday',
    getRange: () => {
      const now = new Date();
      const end = subSeconds(endOfDay(subDays(now, 1)), 1);
      const start = startOfDay(subDays(now, 1));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last hour',
    value: '1h',
    getRange: () => {
      const end = new Date();
      const start = subHours(end, 1);
      return { startDate: start, endDate: end };
    },
  },
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
    label: 'Last 3 days',
    value: '3d',
    getRange: () => {
      const now = new Date();
      const end = subSeconds(endOfDay(now), 1);
      const start = startOfDay(subDays(now, 2));
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
    label: 'Last 14 days',
    value: '14d',
    getRange: () => {
      const now = new Date();
      const end = subSeconds(endOfDay(now), 1);
      const start = startOfDay(subDays(now, 13));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 30 days',
    value: '30d',
    getRange: () => {
      const now = new Date();
      const end = subSeconds(endOfDay(now), 1);
      const start = startOfDay(subDays(now, 29));
      return { startDate: start, endDate: end };
    },
  },
  // Month/Quarter/Year collections
  {
    label: 'Month to Date',
    value: 'mtd',
    getRange: () => {
      const now = new Date();
      const start = startOfMonth(now);
      const end = subSeconds(endOfDay(now), 1);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last month',
    value: 'last_month',
    getRange: () => {
      const now = new Date();
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const end = subSeconds(lastMonthEnd, 1);
      const start = startOfMonth(subMonths(now, 1));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Quarter to date',
    value: 'qtd',
    getRange: () => {
      const now = new Date();
      // start of current quarter: months 0,3,6,9
      const month = now.getMonth();
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const start = startOfDay(new Date(now.getFullYear(), quarterStartMonth, 1));
      const end = subSeconds(endOfDay(now), 1);
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
  {
    label: 'Last 6 months',
    value: '6mo',
    getRange: () => {
      const now = new Date();
      const end = subSeconds(endOfDay(now), 1);
      const start = startOfDay(subMonths(now, 6));
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Year to date',
    value: 'ytd',
    getRange: () => {
      const now = new Date();
      const start = startOfYear(now);
      const end = subSeconds(endOfDay(now), 1);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 12 months',
    value: '1y',
    getRange: () => {
      const now = new Date();
      const end = subSeconds(endOfDay(now), 1);
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
  if (granularity === 'day') return startOfDay(date);
  if (granularity === 'hour') return startOfHour(date);
  const nearestTo = getMinuteStep(granularity);
  return roundToNearestMinutes(date, { nearestTo, roundingMethod: 'floor' });
}

export function getEndDateWithGranularity(date: Date, granularity: GranularityRangeValues) {
  if (granularity === 'day') return endOfDay(date);
  if (granularity === 'hour') return endOfHour(date);

  const nearestTo = getMinuteStep(granularity);
  return subSeconds(roundToNearestMinutes(date, { nearestTo, roundingMethod: 'ceil' }), 1);
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
