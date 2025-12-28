import { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import { formatCompactFromMilliseconds } from './dateFormatters';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';

/**
 * Format a number to a presentable string with K/M suffix
 * @param num The number to format
 * @param decimalPlaces Number of decimal places (default: 1)
 * @returns Formatted number string (e.g., "1.2K", "3.5M")
 */
export function formatNumber(num: number, decimalPlaces = 1): string {
  if (num === undefined || num === null) return '-';

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(decimalPlaces)}M`;
  }

  if (num >= 1000) {
    return `${(num / 1000).toFixed(decimalPlaces)}K`;
  }

  return (Math.round(num * 1000) / 1000).toString();
}

/**
 * Format a number as a percentage with % symbol
 * @param num The number to format as a percentage
 * @param decimalPlaces Number of decimal places (default: 1)
 * @param options Optional formatting tweaks
 * @returns Formatted percentage string (e.g., "42.5%")
 */
export function formatPercentage(num: number, decimalPlaces = 1, options?: { trimHundred?: boolean }): string {
  const formatted = num.toFixed(decimalPlaces);
  if (options?.trimHundred && Math.abs(num - 100) < Number.EPSILON) {
    return '100%';
  }
  return `${formatted}%`;
}

/**
 * Format a string, adds ellipsis to middle of string instead of end
 */
export function formatString(value: string, maxLength: number = 50) {
  if (value.length <= maxLength) {
    return value;
  }
  const half = Math.floor(maxLength / 2);

  const start = value.slice(0, half);
  const end = value.slice(-half);

  return `${start}...${end}`;
}

/**
 * Capitalize the first letter of a string
 * @param value The string to capitalize
 * @returns The string with the first letter capitalized
 */
export function capitalizeFirstLetter(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatCWV(metric: CoreWebVitalName, value: number | null | undefined, clsDecimals = 3): string {
  if (value === null || value === undefined) return '—';
  if (metric === 'CLS') {
    return Number(value.toFixed(clsDecimals)).toString();
  }
  return formatCompactFromMilliseconds(value);
}

export function getCwvStatusColor(metric: CoreWebVitalName, value: number | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  const [goodThreshold, fairThreshold] = CWV_THRESHOLDS[metric] ?? [];
  if (goodThreshold === undefined || fairThreshold === undefined) return undefined;
  if (value > fairThreshold) return 'var(--cwv-threshold-poor)';
  if (value > goodThreshold) return 'var(--cwv-threshold-fair)';
  return 'var(--cwv-threshold-good)';
}

export function formatDowntimeFromUptimeHours(uptimePercent: number, hours: number): string {
  const downtimeHours = ((100 - uptimePercent) / 100) * hours;
  if (downtimeHours >= 24) {
    const days = downtimeHours / 24;
    return `${days.toFixed(1)}d down`;
  }
  if (downtimeHours >= 1) {
    return `${downtimeHours.toFixed(1)}h down`;
  }
  const minutes = downtimeHours * 60;
  return `${minutes.toFixed(0)}m down`;
}

export function formatDowntimeFromUptimeDays(uptimePercent: number, days: number): string {
  return formatDowntimeFromUptimeHours(uptimePercent, days * 24);
}

export function formatTimeFromNow(date: Date, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);

  const divisions: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ];

  for (const [unit, secondsInUnit] of divisions) {
    const value = diffSec / secondsInUnit;
    if (Math.abs(value) >= 1) {
      return rtf.format(Math.round(value), unit);
    }
  }

  return rtf.format(0, 'second');
}
