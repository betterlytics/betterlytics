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

// Helper function to format time ago in a user-friendly way
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ago`;
  } else {
    return 'Recently';
  }
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
