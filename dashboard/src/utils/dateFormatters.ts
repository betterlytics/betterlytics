import type { SupportedLanguages } from '@/constants/i18n';
import { DateString, DateTimeString } from '@/types/dates';

// Formats date strings to Clickhouse date column format
export function toDateString(date: string | Date): DateString {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

// Formats date strings to Clickhouse datetime column format
export function toDateTimeString(date: string | Date): DateTimeString {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Formats date strings to Clickhouse datetime column format
 * @param dateTime DateTimeString
 * @returns DateTimeString
 */
export function toClickHouseGridStartString(dateTime: DateTimeString): DateTimeString {
  if (dateTime.length != 19) {
    return dateTime;
  }
  // The "seconds" need to be 0
  // So "2025-06-30 15:53:12" --> "2025-06-30 15:53:00"
  const dateMissingSeconds = dateTime.substring(0, 16);
  return `${dateMissingSeconds}:00`;
}

/** Formats a numeric value with an Intl unit suffix (narrow display). */
function formatUnit(
  value: number,
  unit: 'second' | 'minute' | 'hour' | 'day' | 'millisecond',
  locale?: SupportedLanguages,
): string {
  return new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'narrow' }).format(value);
}

// Helper function to format duration in a user-friendly way
export function formatDuration(seconds: number, locale?: SupportedLanguages): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) parts.push(formatUnit(Math.floor(hours), 'hour', locale));
  if (minutes > 0 || hours > 0) parts.push(formatUnit(Math.floor(minutes), 'minute', locale));
  parts.push(formatUnit(Math.floor(remainingSeconds), 'second', locale));

  return parts.join(' ');
}

/**
 * Formats elapsed time from a start date to now in a compact two-unit format.
 * Examples: "2d 14h", "5h 32m", "45m", "< 1m"
 */
export function formatElapsedTime(startDate: Date, locale?: SupportedLanguages): string {
  const diffMs = Date.now() - startDate.getTime();
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  if (days > 0) {
    const hoursRemainder = totalHours % 24;
    return hoursRemainder > 0
      ? `${formatUnit(days, 'day', locale)} ${formatUnit(hoursRemainder, 'hour', locale)}`
      : formatUnit(days, 'day', locale);
  }
  if (totalHours > 0) {
    const minutesRemainder = totalMinutes % 60;
    return minutesRemainder > 0
      ? `${formatUnit(totalHours, 'hour', locale)} ${formatUnit(minutesRemainder, 'minute', locale)}`
      : formatUnit(totalHours, 'hour', locale);
  }
  if (totalMinutes > 0) {
    return formatUnit(totalMinutes, 'minute', locale);
  }
  return `< ${formatUnit(1, 'minute', locale)}`;
}

/**
 * Formats seconds as a compact single-unit duration string.
 * Uses only the largest applicable unit without breakdown.
 * Examples: 30 → "30s", 120 → "2m", 3600 → "1h", 86400 → "1d"
 */
export function formatCompactDuration(seconds: number, locale?: SupportedLanguages): string {
  if (seconds < 60) return formatUnit(seconds, 'second', locale);
  const minutes = seconds / 60;
  if (minutes < 60) return formatUnit(minutes, 'minute', locale);
  const hours = minutes / 60;
  if (hours < 24) return formatUnit(hours, 'hour', locale);
  const days = hours / 24;
  return formatUnit(days, 'day', locale);
}

/**
 * Splits seconds into a value and an Intl.NumberFormat config for animation purposes.
 * Logic matches formatCompactDuration but returns parts suitable for animated display.
 */
export function splitCompactDuration(seconds: number): {
  value: number;
  format: { style: 'unit'; unit: 'second' | 'minute' | 'hour' | 'day'; unitDisplay: 'narrow' };
} {
  if (seconds < 60) return { value: seconds, format: { style: 'unit', unit: 'second', unitDisplay: 'narrow' } };
  const minutes = seconds / 60;
  if (minutes < 60) return { value: minutes, format: { style: 'unit', unit: 'minute', unitDisplay: 'narrow' } };
  const hours = minutes / 60;
  if (hours < 24) return { value: hours, format: { style: 'unit', unit: 'hour', unitDisplay: 'narrow' } };
  const days = hours / 24;
  return { value: days, format: { style: 'unit', unit: 'day', unitDisplay: 'narrow' } };
}

/**
 * Formats seconds as either full seconds (two decimals) or milliseconds when < 1 second.
 * Examples: 1.02 seconds, 1.20 seconds, 800 ms, 340 ms
 */
export function formatCompactSeconds(seconds: number, locale?: SupportedLanguages): string {
  if (!Number.isFinite(seconds)) return '—';
  if (Math.abs(seconds) < 1) {
    return formatUnit(Math.round(seconds * 1000), 'millisecond', locale);
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'second',
    unitDisplay: 'narrow',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(seconds);
}

export function formatCompactFromMilliseconds(
  milliseconds: number | null | undefined,
  locale?: SupportedLanguages,
): string {
  if (milliseconds == null || typeof milliseconds !== 'number' || !Number.isFinite(milliseconds)) {
    return '—';
  }
  return formatCompactSeconds(milliseconds / 1000, locale);
}

/**
 * Splits milliseconds into a value and an Intl-compatible unit for animation purposes.
 * < 1000ms → milliseconds (rounded), >= 1000ms → seconds (with decimal)
 */
export function splitCompactFromMilliseconds(ms: number): {
  value: number;
  format: { style: 'unit'; unit: 'millisecond' | 'second'; unitDisplay: 'narrow' };
} {
  const rounded = Math.round(ms);
  if (rounded < 1000) return { value: rounded, format: { style: 'unit', unit: 'millisecond', unitDisplay: 'narrow' } };
  return { value: ms / 1000, format: { style: 'unit', unit: 'second', unitDisplay: 'narrow' } };
}

/*
 * Format a timestamp in the format of mm:ss
 */
export function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/*
 * Format a duration with more precision such as 0.0600 s
 */
export function formatDurationPrecise(ms: number, locale?: SupportedLanguages): string {
  if (ms < 1000) {
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'second',
      unitDisplay: 'narrow',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(ms / 1000);
  }
  if (ms < 60_000) {
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'second',
      unitDisplay: 'narrow',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(ms / 1000);
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${formatUnit(minutes, 'minute', locale)} ${formatUnit(seconds, 'second', locale)}`;
}

export function formatTimeLeft(daysLeft: number | null): { value: string; unit: string } {
  if (daysLeft == null) {
    return { value: '—', unit: '' };
  }
  const roundedDays = Math.max(0, Math.round(daysLeft));
  const unit = roundedDays === 1 ? 'day' : 'days';
  return { value: `${roundedDays}`, unit };
}

// Formats a date/time to a locale-aware human-readable string
export function formatLocalDateTime(
  date: string | Date | undefined | null,
  locale?: SupportedLanguages,
  options?: Intl.DateTimeFormatOptions,
): string | undefined {
  if (!date) return undefined;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return undefined;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

// Formats a date relative to now (e.g., "3 days ago"), localized via Intl.RelativeTimeFormat
export function formatRelativeTimeFromNow(date: string | Date, locale?: SupportedLanguages): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';

  const diffSeconds = Math.round((d.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const absSeconds = Math.abs(diffSeconds);
  if (absSeconds < 45) return rtf.format(diffSeconds, 'second');

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 45) return rtf.format(diffMinutes, 'minute');

  const diffHours = Math.floor(diffMinutes / 60);
  if (Math.abs(diffHours) < 22) return rtf.format(diffHours, 'hour');

  const diffDays = Math.floor(diffHours / 24);
  if (Math.abs(diffDays) < 26) return rtf.format(diffDays, 'day');

  const diffMonths = Math.floor(diffDays / 30);
  if (Math.abs(diffMonths) < 11) return rtf.format(diffMonths, 'month');

  const diffYears = Math.floor(diffDays / 365);
  return rtf.format(diffYears, 'year');
}

/**
 * Formats a week as a date range like "Jan 6 – 12" or "Dec 30 – Jan 5"
 * Optionally includes the year: "Jan 6 – 12, 2026"
 */
export function formatWeekRange(date: Date, locale?: SupportedLanguages, includeYear = false): string {
  const weekStart = new Date(date);
  const weekEnd = new Date(date);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startMonth = new Intl.DateTimeFormat(locale, { month: 'short' }).format(weekStart);
  const endMonth = new Intl.DateTimeFormat(locale, { month: 'short' }).format(weekEnd);
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const yearSuffix = includeYear ? `, ${weekEnd.getFullYear()}` : '';

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}${yearSuffix}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}${yearSuffix}`;
}
