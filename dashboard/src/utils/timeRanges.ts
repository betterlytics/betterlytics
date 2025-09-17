import {
  subDays,
  subMonths,
  subSeconds,
  endOfDay,
  startOfDay,
  endOfHour,
  startOfHour,
  roundToNearestMinutes,
} from 'date-fns';
import { GranularityRangeValues, getMinuteStep } from './granularityRanges';

export const TIME_RANGE_VALUES = ['24h', '3d', '7d', '28d', '3mo', '6mo', 'custom'] as const;
export type TimeRangeValue = (typeof TIME_RANGE_VALUES)[number];
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
