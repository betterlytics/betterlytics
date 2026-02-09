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

// Helper function to format duration in a user-friendly way
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) parts.push(`${Math.floor(hours)}h`);
  if (minutes > 0 || hours > 0) parts.push(`${Math.floor(minutes)}m`);
  parts.push(`${Math.floor(remainingSeconds)}s`);

  return parts.join(' ');
}

/**
 * Formats elapsed time from a start date to now in a compact two-unit format.
 * Examples: "2d 14h", "5h 32m", "45m", "< 1m"
 */
export function formatElapsedTime(startDate: Date): string {
  const diffMs = Date.now() - startDate.getTime();
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  if (days > 0) {
    const hoursRemainder = totalHours % 24;
    return hoursRemainder > 0 ? `${days}d ${hoursRemainder}h` : `${days}d`;
  }
  if (totalHours > 0) {
    const minutesRemainder = totalMinutes % 60;
    return minutesRemainder > 0 ? `${totalHours}h ${minutesRemainder}m` : `${totalHours}h`;
  }
  if (totalMinutes > 0) {
    return `${totalMinutes}m`;
  }
  return '< 1m';
}

/**
 * Formats seconds as a compact single-unit duration string.
 * Uses only the largest applicable unit without breakdown.
 * Examples: 30 → "30s", 120 → "2m", 3600 → "1h", 86400 → "1d"
 */
export function formatCompactDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours}h`;
  const days = hours / 24;
  return `${days}d`;
}

/**
 * Splits seconds into a value and an Intl-compatible unit for animation purposes.
 * Logic matches formatCompactDuration but returns parts suitable for Intl.NumberFormat.
 */
export function splitCompactDuration(seconds: number): {
  value: number;
  intlUnit: 'second' | 'minute' | 'hour' | 'day';
} {
  if (seconds < 60) return { value: seconds, intlUnit: 'second' };
  const minutes = seconds / 60;
  if (minutes < 60) return { value: minutes, intlUnit: 'minute' };
  const hours = minutes / 60;
  if (hours < 24) return { value: hours, intlUnit: 'hour' };
  const days = hours / 24;
  return { value: days, intlUnit: 'day' };
}

/**
 * Formats seconds as either full seconds (two decimals) or milliseconds when < 1 second.
 * Examples: 1.02 seconds, 1.20 seconds, 800 ms, 340 ms
 */
export function formatCompactSeconds(seconds: number): string {
  if (!Number.isFinite(seconds)) return '—';
  if (Math.abs(seconds) < 1) {
    return `${Math.round(seconds * 1000)} ms`;
  }
  return `${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(seconds)} s`;
}

export function formatCompactFromMilliseconds(milliseconds: number | null | undefined): string {
  if (milliseconds == null || typeof milliseconds !== 'number' || !Number.isFinite(milliseconds)) {
    return '—';
  }
  return formatCompactSeconds(milliseconds / 1000);
}

/**
 * Splits milliseconds into a value and an Intl-compatible unit for animation purposes.
 * < 1000ms → milliseconds (rounded), >= 1000ms → seconds (with decimal)
 */
export function splitCompactFromMilliseconds(ms: number): {
  value: number;
  intlUnit: 'millisecond' | 'second';
} {
  const rounded = Math.round(ms);
  if (rounded < 1000) return { value: rounded, intlUnit: 'millisecond' };
  return { value: ms / 1000, intlUnit: 'second' };
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
export function formatDurationPrecise(ms: number): string {
  if (ms < 1000) {
    return `${(ms / 1000).toFixed(4)}s`;
  }
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
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
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
): string | undefined {
  if (!date) return undefined;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return undefined;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

// Formats a date relative to now (e.g., "3 days ago"), localized via Intl.RelativeTimeFormat
export function formatRelativeTimeFromNow(date: string | Date, locale?: string): string {
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
export function formatWeekRange(date: Date, locale?: string, includeYear = false): string {
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
