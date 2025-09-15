import {
  subDays,
  subMonths,
  subSeconds,
  subMilliseconds,
  subHours,
  subYears,
  endOfDay,
  startOfDay,
  endOfHour,
  startOfHour,
  startOfYear,
  roundToNearestMinutes,
} from 'date-fns';
import { GranularityRangeValues, getMinuteStep } from './granularityRanges';

export type TimeRangeValue =
  | '1h'
  | '6h'
  | '12h'
  | '24h'
  | '3d'
  | '7d'
  | '14d'
  | '28d'
  | '3mo'
  | '6mo'
  | '12mo'
  | 'ytd'
  | 'custom';
export type TimeGrouping = 'minute' | 'hour' | 'day';

export interface TimeRangePreset {
  label: string;
  value: TimeRangeValue;
  getRange: () => { startDate: Date; endDate: Date };
}

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
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
    label: 'Last 6 hours',
    value: '6h',
    getRange: () => {
      const end = new Date();
      const start = subHours(end, 6);
      return { startDate: start, endDate: end };
    },
  },
  {
    label: 'Last 12 hours',
    value: '12h',
    getRange: () => {
      const end = new Date();
      const start = subHours(end, 12);
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
    label: 'Last 12 months',
    value: '12mo',
    getRange: () => {
      const now = new Date();
      const end = subSeconds(endOfDay(now), 1);
      const start = startOfDay(subMonths(now, 12));
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

export function getPreviousPeriodForRange(startDate: Date, endDate: Date) {
  const durationMs = endDate.getTime() - startDate.getTime();
  const compareEnd = subSeconds(startDate, 1);
  const compareStart = subMilliseconds(startDate, durationMs);
  return { compareStart, compareEnd };
}

export function getYearOverYearForRange(startDate: Date, endDate: Date) {
  const compareStart = subYears(startDate, 1);
  const compareEnd = subYears(endDate, 1);
  return { compareStart, compareEnd };
}
