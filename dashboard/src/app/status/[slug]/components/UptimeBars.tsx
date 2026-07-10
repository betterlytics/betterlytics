'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { SupportedLanguages } from '@/constants/i18n';
import type { StatusPageTheme } from '@/entities/analytics/statusPage/statusPage.entities';
import type { PublicDailyUptimeBucket } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { formatUptime } from '@/utils/formatters';
import { formatLocalDateTime } from '@/utils/dateFormatters';
import { UptimeBarTooltip } from './UptimeBarTooltip';

export const UPTIME_BARS_COMPACT_DAYS = 45;

function cellColor(upRatio: number | null): string {
  if (upRatio == null) return 'var(--sp-neutral)';
  const pct = upRatio * 100;
  if (pct >= 99) return 'var(--sp-ok)';
  if (pct >= 95) return 'var(--sp-warn)';
  return 'var(--sp-down)';
}

type UptimeBarsProps = {
  days: PublicDailyUptimeBucket[];
  startLabelFull: string;
  startLabelCompact: string;
  todayLabel: string;
  locale: SupportedLanguages;
  /** Owner theme, forwarded so each pill's body-portaled tooltip keeps the page's colors. */
  theme: StatusPageTheme;
};

export function UptimeBars({ days, startLabelFull, startLabelCompact, todayLabel, locale, theme }: UptimeBarsProps) {
  const t = useTranslations('publicStatusPage');

  // Cells older than the compact window hide via CSS on narrow widths, so the
  // tooltip set (one Radix root per day) mounts once instead of full + compact copies.
  const compactStart = Math.max(0, days.length - UPTIME_BARS_COMPACT_DAYS);
  const cells = days.map((day, index) => {
    // date is yyyy-mm-dd, UTC bucketed — format in UTC so it never shifts a day per visitor timezone.
    const dateLabel = formatLocalDateTime(day.date, locale, { dateStyle: 'medium', timeZone: 'UTC' }) ?? day.date;
    const description =
      day.upRatio == null ? t('noData') : t('uptimeValue', { uptime: formatUptime(day.upRatio * 100, locale) });

    return (
      <UptimeBarTooltip key={day.date} title={dateLabel} description={description} theme={theme}>
        <span
          suppressHydrationWarning
          aria-label={`${dateLabel} · ${description}`}
          className={cn(
            'h-7 min-w-0 flex-1 rounded-[2px] transition-[filter] hover:brightness-110',
            index < compactStart && 'hidden @min-[640px]:block',
          )}
          style={{ backgroundColor: cellColor(day.upRatio) }}
        />
      </UptimeBarTooltip>
    );
  });

  return (
    <>
      {/* 90 cells get too cramped on narrow widths so we collapse to the most recent 45 */}
      <div className='mt-3 flex gap-[2px] @min-[640px]:mt-2'>{cells}</div>
      <div className='mt-2 flex justify-between text-xs text-[var(--sp-muted)]'>
        <span className='hidden @min-[640px]:inline'>{startLabelFull}</span>
        <span className='@min-[640px]:hidden'>{startLabelCompact}</span>
        <span>{todayLabel}</span>
      </div>
    </>
  );
}
