import { useTranslations } from 'next-intl';
import {
  STATUS_PAGE_LIMITS,
  type PublicMonitorStatus,
  type PublicStatusPageData,
} from '@/entities/analytics/statusPage.entities';
import { formatPercentage } from '@/utils/formatters';
import { UptimeBars, UPTIME_BARS_COMPACT_DAYS } from './UptimeBars';

const UPTIME_FORMAT = { minimumFractionDigits: 2, maximumFractionDigits: 2, trimHundred: true } as const;

const STATUS_DOT: Record<PublicMonitorStatus, string> = {
  operational: 'var(--sp-ok)',
  degraded: 'var(--sp-warn)',
  down: 'var(--sp-down)',
  unknown: 'var(--sp-faint)',
};

const STATUS_PILL: Record<PublicMonitorStatus, { color: string; background: string; borderColor: string }> = {
  operational: {
    color: 'var(--sp-pill-ok-text)',
    background: 'var(--sp-pill-ok-bg)',
    borderColor: 'var(--sp-pill-ok-border)',
  },
  degraded: {
    color: 'var(--sp-pill-warn-text)',
    background: 'var(--sp-pill-warn-bg)',
    borderColor: 'var(--sp-pill-warn-border)',
  },
  down: {
    color: 'var(--sp-pill-down-text)',
    background: 'var(--sp-pill-down-bg)',
    borderColor: 'var(--sp-pill-down-border)',
  },
  unknown: {
    color: 'var(--sp-pill-neutral-text)',
    background: 'var(--sp-pill-neutral-bg)',
    borderColor: 'var(--sp-pill-neutral-border)',
  },
};

export function MonitorUptimeCard({ data }: { data: PublicStatusPageData }) {
  const t = useTranslations('publicStatusPage');

  return (
    <div className='overflow-hidden rounded-xl border border-[var(--sp-card-border)] bg-[var(--sp-card-bg)] [box-shadow:var(--sp-card-shadow)]'>
      {data.monitors.map((monitor) => (
        <div key={monitor.key} className='border-b border-[var(--sp-card-divider)] px-5 py-5 last:border-b-0 sm:px-6'>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex min-w-0 items-center gap-2.5'>
              <span
                className='h-2 w-2 flex-none rounded-full'
                style={{ backgroundColor: STATUS_DOT[monitor.status] }}
              />
              <span className='truncate text-[15px] font-semibold text-[var(--sp-text)]'>{monitor.publicName}</span>
            </div>
            <div className='flex flex-none items-center gap-3'>
              {monitor.uptime != null && (
                <span suppressHydrationWarning className='hidden text-[13px] text-[var(--sp-muted)] sm:inline'>
                  {t('uptimeValue', { uptime: formatPercentage(monitor.uptime, 'en', UPTIME_FORMAT) })}
                </span>
              )}
              <span className='rounded-full border px-3 py-1 text-xs font-semibold' style={STATUS_PILL[monitor.status]}>
                {t(`monitorStatus.${monitor.status}`)}
              </span>
            </div>
          </div>
          <UptimeBars
            days={monitor.days}
            startLabelFull={t('uptimeWindow.start', { days: STATUS_PAGE_LIMITS.UPTIME_WINDOW_DAYS })}
            startLabelCompact={t('uptimeWindow.start', { days: UPTIME_BARS_COMPACT_DAYS })}
            todayLabel={t('uptimeWindow.today')}
            locale='en'
          />
        </div>
      ))}
      {data.overallUptime != null && (
        <div
          suppressHydrationWarning
          className='border-t border-[var(--sp-card-divider)] bg-[var(--sp-card-footer-bg)] px-5 py-3.5 text-xs text-[var(--sp-muted)] sm:px-6'
        >
          {t.rich('overallUptime', {
            uptime: formatPercentage(data.overallUptime, 'en', UPTIME_FORMAT),
            days: STATUS_PAGE_LIMITS.UPTIME_WINDOW_DAYS,
            value: (chunks) => <span className='font-semibold text-[var(--sp-text)]'>{chunks}</span>,
          })}
        </div>
      )}
    </div>
  );
}
