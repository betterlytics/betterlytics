import {
  subDays,
  subMonths,
  subSeconds,
  subMilliseconds,
  endOfDay,
  startOfDay,
  endOfHour,
  endOfMinute,
  startOfHour,
  startOfMinute,
  addMinutes,
} from 'date-fns';
import { GranularityRangeValues, getMinuteStep } from './granularityRanges';

export type TimeRangeValue = '24h' | '3d' | '7d' | '28d' | '3mo' | '6mo' | 'custom';
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

  // Minute-based granularities: align to grid step
  const step = getMinuteStep(granularity);
  const startMinute = Math.floor(date.getMinutes() / step) * step;
  const aligned = new Date(date);
  aligned.setSeconds(0, 0);
  aligned.setMinutes(startMinute);
  return startOfMinute(aligned);
}

export function getEndDateWithGranularity(date: Date, granularity: GranularityRangeValues) {
  if (granularity === 'day') return endOfDay(date);
  if (granularity === 'hour') return endOfHour(date);

  // Minute-based granularities: align to end of current grid bucket
  const step = getMinuteStep(granularity);
  const startAligned = getStartDateWithGranularity(date, granularity);
  return endOfMinute(addMinutes(startAligned, step - 1));
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
