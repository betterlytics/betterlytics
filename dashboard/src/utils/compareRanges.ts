import { getDateRangeForTimePresets, TimeRangeValue } from '@/utils/timeRanges';
import { addDays, startOfDay, subMilliseconds, subSeconds, subYears } from 'date-fns';

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
  alignWeekdays?: boolean,
): { startDate: Date; endDate: Date } | undefined {
  if (mode === 'off') return undefined;
  if (mode === 'previous') {
    const durationMs = mainEnd.getTime() - mainStart.getTime();
    let compareEnd = subSeconds(mainStart, 1);
    let compareStart = subMilliseconds(mainStart, durationMs);
    if (alignWeekdays) {
      // Normalize to calendar days to avoid DST/time-of-day quirks
      const normMainStart = startOfDay(mainStart);
      const normCompareStart = startOfDay(compareStart);
      // Shift backward up to 6 days so weekday of compareStart matches weekday of mainStart
      const shiftBackDays = (normCompareStart.getDay() - normMainStart.getDay() + 7) % 7;
      if (shiftBackDays !== 0) {
        compareStart = addDays(compareStart, -shiftBackDays);
        compareEnd = addDays(compareEnd, -shiftBackDays);
      }
    }
    return { startDate: compareStart, endDate: compareEnd };
  }
  if (mode === 'year') {
    let start = subYears(mainStart, 1);
    let end = subYears(mainEnd, 1);
    if (alignWeekdays) {
      const normMainStart = startOfDay(mainStart);
      const normCompareStart = startOfDay(start);
      const delta = (normMainStart.getDay() - normCompareStart.getDay() + 7) % 7;
      if (delta !== 0) {
        start = addDays(start, delta);
        end = addDays(end, delta);
      }
    }
    return { startDate: start, endDate: end };
  }
  if (mode === 'custom' && custom?.startDate && custom?.endDate) {
    return { startDate: custom.startDate, endDate: custom.endDate };
  }
  return undefined;
}
