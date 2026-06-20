import type { SupportedLanguages } from '@/constants/i18n';
import type { PublicDailyUptimeBucket } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { formatPercentage } from '@/utils/formatters';

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
  const cells = (buckets: PublicDailyUptimeBucket[]) =>
    buckets.map((day) => (
      <span
        key={day.date}
        suppressHydrationWarning
        title={
          day.upRatio == null
            ? day.date
            : `${day.date} · ${formatPercentage(day.upRatio * 100, locale, { maximumFractionDigits: 2 })}`
        }
        className='h-7 min-w-0 flex-1 rounded-[2px]'
        style={{ backgroundColor: cellColor(day.upRatio) }}
      />
    ));

  return (
    <>
      {/* 90 cells get too cramped on narrow viewports so we collapse to the most recent 45 */}
      <div className='mt-3 hidden gap-[2px] sm:flex'>{cells(days)}</div>
      <div className='mt-3 flex gap-[2px] sm:hidden'>{cells(days.slice(-UPTIME_BARS_COMPACT_DAYS))}</div>
      <div className='mt-2 flex justify-between text-xs text-[var(--sp-faint)]'>
        <span className='hidden sm:inline'>{startLabelFull}</span>
        <span className='sm:hidden'>{startLabelCompact}</span>
        <span>{todayLabel}</span>
      </div>
    </>
  );
}
