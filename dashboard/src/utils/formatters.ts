import type { SupportedLanguages } from '@/constants/i18n';
import { getStringWidth, sliceToWidth } from '@/utils/stringWidth';

/**
 * Format a number using locale-aware compact notation (e.g., 1.5K, 1,5 t).
 */
export function formatNumber(num: number, locale?: SupportedLanguages, opts?: Intl.NumberFormatOptions): string {
  if (num == null) return '-';
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
    ...opts,
  }).format(num);
}

/**
 * Format a number (e.g., 42.5) as a locale-aware percentage (e.g., 42.5%, 42,5 %).
 */
export function formatPercentage(
  num: number,
  locale?: SupportedLanguages,
  opts?: Intl.NumberFormatOptions & { trimHundred?: boolean },
): string {
  const { trimHundred, ...intlOpts } = opts ?? {};
  if (trimHundred && Math.abs(num - 100) < Number.EPSILON) {
    return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(1);
  }
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    ...intlOpts,
  }).format(num / 100);
}

/**
 * Format a string, adds ellipsis to the middle of the string instead of the end.
 *
 * `maxLength` is a budget of rendered columns, not code units, so wide scripts
 * (Japanese, Chinese, Korean) and emoji stay within the same visual width as
 * Latin text instead of overflowing. Slicing is grapheme-safe.
 */
export function formatString(value: string, maxLength: number = 50) {
  if (getStringWidth(value) <= maxLength) {
    return value;
  }
  const half = Math.floor(maxLength / 2);

  const start = sliceToWidth(value, half);
  const end = sliceToWidth(value, half, true);

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

export type DowntimeMetadata = {
  unit: 'days' | 'hours' | 'minutes';
  value: string;
};

export function computeDowntimeFromUptimeHours(uptimePercent: number, hours: number): DowntimeMetadata {
  const downtimeHours = ((100 - uptimePercent) / 100) * hours;
  if (downtimeHours >= 24) {
    const days = downtimeHours / 24;
    return { unit: 'days', value: days.toFixed(1) };
  }
  if (downtimeHours >= 1) {
    return { unit: 'hours', value: downtimeHours.toFixed(1) };
  }
  const minutes = downtimeHours * 60;
  return { unit: 'minutes', value: minutes.toFixed(0) };
}

export function computeDowntimeFromUptimeDays(uptimePercent: number, days: number): DowntimeMetadata {
  return computeDowntimeFromUptimeHours(uptimePercent, days * 24);
}

export function formatTimeFromNow(date: Date, locale: SupportedLanguages): string {
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
