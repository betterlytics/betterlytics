import { getDateRangeForTimePresets, TimeRangeValue } from '@/utils/timeRanges';
import { subMilliseconds, subSeconds, subYears } from 'date-fns';

export const COMPARE_URL_MODES = ['previous', 'year', 'off', 'custom'] as const;
export type CompareMode = (typeof COMPARE_URL_MODES)[number];

export interface CompareCustomRange {
  startDate?: Date;
  endDate?: Date;
}

export function isDerivedCompareMode(mode: CompareMode): mode is 'previous' | 'year' {
  return mode === 'previous' || mode === 'year';
}

// Deprecated: prefer deriveCompareRange with CompareMode
export function getCompareRangeForTimePresets(value: Omit<TimeRangeValue, 'custom'>) {
  const { startDate, endDate } = getDateRangeForTimePresets(value);
  const durationMs = endDate.getTime() - startDate.getTime();
  const compareEnd = subSeconds(startDate, 1);
  const compareStart = subMilliseconds(startDate, durationMs);
  return { compareStart, compareEnd };
}

export function deriveCompareRange(
  mainStart: Date,
  mainEnd: Date,
  mode: CompareMode,
  custom?: CompareCustomRange,
): { startDate: Date; endDate: Date } | undefined {
  if (mode === 'off') return undefined;
  if (mode === 'previous') {
    const durationMs = mainEnd.getTime() - mainStart.getTime();
    const compareEnd = subSeconds(mainStart, 1);
    const compareStart = subMilliseconds(mainStart, durationMs);
    return { startDate: compareStart, endDate: compareEnd };
  }
  if (mode === 'year') {
    const start = subYears(mainStart, 1);
    const end = subYears(mainEnd, 1);
    return { startDate: start, endDate: end };
  }
  if (mode === 'custom' && custom?.startDate && custom?.endDate) {
    return { startDate: custom.startDate, endDate: custom.endDate };
  }
  return undefined;
}
