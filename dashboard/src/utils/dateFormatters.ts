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
