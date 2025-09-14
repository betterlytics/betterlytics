import { Minus, ChevronUp, ChevronDown } from 'lucide-react';
import { GranularityRangeValues, getMinuteStep } from './granularityRanges';
import { timeFormat } from 'd3-time-format';
import { utcDay, utcHour, utcMinute, type TimeInterval } from 'd3-time';

export interface TrendInfo {
  icon: typeof ChevronUp | typeof ChevronDown | typeof Minus;
  color: string;
  bgColor: string;
}

export function getTrendInfo(current: number, previous: number, hasComparison: boolean): TrendInfo {
  if (!hasComparison || previous === 0) {
    return { icon: Minus, color: 'text-gray-400', bgColor: 'bg-gray-500/10' };
  }

  const diff = current - previous;
  if (diff > 0) {
    return { icon: ChevronUp, color: 'text-trend-up', bgColor: 'bg-green-500/10' };
  }
  if (diff < 0) {
    return { icon: ChevronDown, color: 'text-trend-down', bgColor: 'bg-red-500/10' };
  }
  return { icon: Minus, color: 'text-gray-400', bgColor: 'bg-gray-500/10' };
}

export function formatDifference(
  current: number,
  previous: number,
  hasComparison: boolean,
  formatter?: (value: number) => string,
  includePreviousNumber: boolean = true,
): string | null {
  if (!hasComparison || previous === 0) return null;

  const diff = current - previous;
  if (diff === 0) return null;

  const sign = diff > 0 ? '+' : '';
  const formattedDiff = formatter ? formatter(diff) : diff.toString();

  const percentage = ((diff / previous) * 100).toFixed(1);

  if (previous !== 0 && includePreviousNumber) {
    return `${sign}${percentage}% (${sign}${formattedDiff})`;
  } else if (!includePreviousNumber) {
    return `${sign}${percentage}%`;
  }

  return `${sign}${formattedDiff}`;
}

/*
 * Formats the date based on the granularity
 */
export function defaultDateLabelFormatter(date: string | number, granularity?: GranularityRangeValues) {
  const formatter = granularityDateFormatter(granularity);
  return formatter(new Date(date));
}

export function granularityDateFormatter(granularity?: GranularityRangeValues) {
  if (granularity === undefined || granularity === 'day') {
    return timeFormat('%b %d');
  }

  return timeFormat('%b %d - %H:%M');
}

export function getTimeIntervalForGranularity(granularity: GranularityRangeValues): TimeInterval {
  if (granularity === 'day') return utcDay;
  if (granularity === 'hour') return utcHour;
  return utcMinute.every(getMinuteStep(granularity)) as TimeInterval;
}
