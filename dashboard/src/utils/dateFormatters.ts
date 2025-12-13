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

// Helper function to format time ago in a user-friendly way.
// When `precise` is true, include seconds (e.g., "1m 23s ago", "11s ago").
export function formatTimeAgo(date: Date, precise?: boolean): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  if (precise) {
    if (days > 0) {
      const hoursRemainder = totalHours % 24;
      return `${days}d${hoursRemainder ? ` ${hoursRemainder}h` : ''} ago`;
    }
    if (totalHours > 0) {
      const minutesRemainder = totalMinutes % 60;
      return `${totalHours}h${minutesRemainder ? ` ${minutesRemainder}m` : ''} ago`;
    }
    if (totalMinutes > 0) {
      const secondsRemainder = totalSeconds % 60;
      return `${totalMinutes}m${secondsRemainder ? ` ${secondsRemainder}s` : ''} ago`;
    }
    return `${totalSeconds}s ago`;
  }

  if (days > 0) {
    return `${days}d ago`;
  }
  if (totalHours > 0) {
    return `${totalHours}h ago`;
  }
  if (totalMinutes > 0) {
    return `${totalMinutes}m ago`;
  }
  return 'Recently';
}

/**
 * Formats seconds as either full seconds (two decimals) or milliseconds when < 1 second.
 * Examples: 1.02 seconds, 1.20 seconds, 800 ms, 340 ms
 */
export function formatShortSeconds(seconds: number): string {
  if (!Number.isFinite(seconds)) return '-';
  if (Math.abs(seconds) < 1) {
    const ms = Math.round(seconds * 1000);
    return `${ms} ms`;
  }
  return `${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(seconds)} seconds`;
}

/**
 * Formats milliseconds as a short human string, using seconds or ms as appropriate.
 */
export function formatShortFromMilliseconds(milliseconds: number): string {
  return formatShortSeconds(milliseconds / 1000);
}

// Compact duration formatters (short units: s/ms)
export function formatCompactSeconds(seconds: number): string {
  if (!Number.isFinite(seconds)) return '-';
  if (Math.abs(seconds) < 1) {
    return `${Math.round(seconds * 1000)} ms`;
  }
  return `${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(seconds)} s`;
}

export function formatCompactFromMilliseconds(milliseconds: number): string {
  return formatCompactSeconds(milliseconds / 1000);
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
