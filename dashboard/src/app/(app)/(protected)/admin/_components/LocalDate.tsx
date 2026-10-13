'use client';

import { useFormattedDate } from '@/hooks/use-formatted-date';
import { formatRelative } from '@/app/(app)/(protected)/admin/_lib/format';

const DATE_OPTIONS: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = { ...DATE_OPTIONS, hour: '2-digit', minute: '2-digit' };

// Module-level so the hook's effect dependencies stay stable across renders
const DATE_CONFIG = { locales: 'en-US', options: DATE_OPTIONS };
const DATE_TIME_CONFIG = { locales: 'en-US', options: DATE_TIME_OPTIONS };

function useLocalDate(date: Date | null, includeTime: boolean): string | null {
  const { formattedDate } = useFormattedDate(date ?? undefined, includeTime ? DATE_TIME_CONFIG : DATE_CONFIG);
  return date ? formattedDate : null;
}

export function LocalDate({ date, includeTime = false }: { date: Date; includeTime?: boolean }) {
  return <>{useLocalDate(date, includeTime)}</>;
}

export function LastActive({ date }: { date: Date | null }) {
  const title = useLocalDate(date, true);
  return <span title={title ?? undefined}>{formatRelative(date)}</span>;
}
