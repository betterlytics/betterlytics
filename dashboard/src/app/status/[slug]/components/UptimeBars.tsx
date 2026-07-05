'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { SupportedLanguages } from '@/constants/i18n';
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
};

export function UptimeBars({ days, startLabelFull, startLabelCompact, todayLabel, locale }: UptimeBarsProps) {
  const t = useTranslations('publicStatusPage');

  // Resolve the status-page root so each pill's tooltip portals inside it and keeps the owner's theme.
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const resolveContainer = useCallback((node: HTMLDivElement | null) => {
    if (node) setContainer(node.closest<HTMLElement>('.bl-status-page'));
  }, []);

  const cells = (buckets: PublicDailyUptimeBucket[]) =>
    buckets.map((day) => {
      // date is yyyy-mm-dd, UTC bucketed — format in UTC so it never shifts a day per visitor timezone.
      const dateLabel =
        formatLocalDateTime(day.date, locale, { dateStyle: 'medium', timeZone: 'UTC' }) ?? day.date;
      const description =
        day.upRatio == null ? t('noData') : t('uptimeValue', { uptime: formatUptime(day.upRatio * 100, locale) });

      return (
        <UptimeBarTooltip key={day.date} title={dateLabel} description={description} container={container}>
          <span
            suppressHydrationWarning
            aria-label={`${dateLabel} · ${description}`}
            className='h-7 min-w-0 flex-1 rounded-[2px] transition-[filter] hover:brightness-110'
            style={{ backgroundColor: cellColor(day.upRatio) }}
          />
        </UptimeBarTooltip>
      );
    });

  return (
    <>
      {/* 90 cells get too cramped on narrow viewports so we collapse to the most recent 45 */}
      <div ref={resolveContainer} className='mt-3 hidden gap-[2px] sm:flex'>
        {cells(days)}
      </div>
      <div className='mt-3 flex gap-[2px] sm:hidden'>{cells(days.slice(-UPTIME_BARS_COMPACT_DAYS))}</div>
      <div className='mt-2 flex justify-between text-xs text-[var(--sp-muted)]'>
        <span className='hidden sm:inline'>{startLabelFull}</span>
        <span className='sm:hidden'>{startLabelCompact}</span>
        <span>{todayLabel}</span>
      </div>
    </>
  );
}
