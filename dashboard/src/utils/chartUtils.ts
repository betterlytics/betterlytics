import { Minus, ChevronUp, ChevronDown } from 'lucide-react';
import { GranularityRangeValues, getMinuteStep } from './granularityRanges';
import { utcDay, utcHour, utcMinute } from 'd3-time';
import { fromZonedTime, getTimezoneOffset, toZonedTime } from 'date-fns-tz';
import { formatNumber } from './formatters';
import { addDays, addHours, addMinutes } from 'date-fns';

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
  const formattedDiff = formatter ? formatter(diff) : formatNumber(diff);

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
export function defaultDateLabelFormatter(
  date: string | number,
  granularity?: GranularityRangeValues,
  locale?: string,
) {
  const d = new Date(date);
  if (granularity === undefined || granularity === 'day') {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
    }).format(d);
  }
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function granularityDateFormatter(granularity?: GranularityRangeValues, locale?: string) {
  if (granularity === undefined || granularity === 'day') {
    return (date: Date) =>
      new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: '2-digit',
      }).format(date);
  }

  return (date: Date) => {
    const datePart = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: '2-digit',
    }).format(date);
    const timePart = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
    return `${datePart} - ${timePart}`;
  };
}

export type TimeInterval = {
  offset: (date: Date, step: number) => Date;
};

export function getTimeIntervalForGranularity(granularity: GranularityRangeValues): TimeInterval {
  if (granularity === 'day') return utcDay;
  if (granularity === 'hour') return utcHour;
  return utcMinute.every(getMinuteStep(granularity)) as TimeInterval;
}

export function getTimeIntervalForGranularityWithTimezone(
  granularity: GranularityRangeValues,
  timezone: string,
): TimeInterval {
  if (granularity === 'day') {
    return {
      offset: (date, step) => {
        const local = toZonedTime(date, timezone);
        const nextLocal = addDays(local, step);

        const deltaOffset = getTimezoneOffset(timezone, local) - getTimezoneOffset(timezone, nextLocal);

        const utcNextCorrected = new Date(nextLocal.getTime() - deltaOffset);
        return fromZonedTime(utcNextCorrected, timezone);
      },
    };
  }

  if (granularity === 'hour') {
    return {
      offset: (date, step) => {
        return addHours(date, step);
      },
    };
  }

  const minuteStep = getMinuteStep(granularity);
  return {
    offset: (date, step) => {
      return addMinutes(date, step * minuteStep);
    },
  };
}
