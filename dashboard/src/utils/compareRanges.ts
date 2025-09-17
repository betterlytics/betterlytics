import { getDateRangeForTimePresets, TimeRangeValue } from '@/utils/timeRanges';
import { differenceInCalendarDays, endOfDay, startOfDay, subMilliseconds, subSeconds } from 'date-fns';

export const COMPARE_URL_MODES = ['previous', 'year', 'off', 'custom'] as const;
export type CompareMode = (typeof COMPARE_URL_MODES)[number];

export interface CompareCustomRange {
  startDate?: Date;
  endDate?: Date;
}

export function isDerivedCompareMode(mode: CompareMode): mode is 'previous' | 'year' {
  return mode === 'previous' || mode === 'year';
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

export function deriveCompareRange(
  mainStart: Date,
  mainEnd: Date,
  mode: CompareMode,
  custom?: CompareCustomRange,
): { startDate: Date; endDate: Date } | undefined {
  if (mode === 'off') return undefined;
  if (mode === 'previous') {
    const days = differenceInCalendarDays(mainEnd, mainStart) + 1;
    const prevEnd = endOfDay(new Date(mainStart.getTime() - 1));
    const prevStart = startOfDay(new Date(prevEnd.getTime() - (days - 1) * 86400000));
    return { startDate: prevStart, endDate: prevEnd };
  }
  if (mode === 'year') {
    const start = new Date(mainStart);
    start.setFullYear(start.getFullYear() - 1);
    const end = new Date(start);
    end.setDate(start.getDate() + differenceInCalendarDays(mainEnd, mainStart));
    return { startDate: startOfDay(start), endDate: endOfDay(end) };
  }
  if (mode === 'custom' && custom?.startDate && custom?.endDate) {
    return { startDate: custom.startDate, endDate: custom.endDate };
  }
  return undefined;
}
