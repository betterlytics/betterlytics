import { CircleCheck, CircleDashed, CircleX, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import {
  type PublicMonitorStatus,
  type PublicStatusPageData,
} from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { formatUptime } from '@/utils/formatters';
import { pillStyle, type PillTone } from '@/components/statusPage/pillStyle';
import { UptimeBars, UPTIME_BARS_COMPACT_DAYS } from './UptimeBars';

const STATUS_ICON: Record<PublicMonitorStatus, LucideIcon> = {
  operational: CircleCheck,
  degraded: TriangleAlert,
  down: CircleX,
  unknown: CircleDashed,
};

const STATUS_ICON_COLOR: Record<PublicMonitorStatus, string> = {
  operational: 'var(--sp-ok)',
  degraded: 'var(--sp-warn)',
  down: 'var(--sp-down)',
  unknown: 'var(--sp-faint)',
};

const MONITOR_PILL_TONE: Record<PublicMonitorStatus, PillTone> = {
  operational: 'ok',
  degraded: 'warn',
  down: 'down',
  unknown: 'neutral',
};

export function MonitorUptimeCard({ data }: { data: PublicStatusPageData }) {
  const t = useTranslations('publicStatusPage');

  return (
    <div className='overflow-hidden rounded-xl border border-[var(--sp-card-border)] bg-[var(--sp-card-bg)] [box-shadow:var(--sp-card-shadow)]'>
      {data.monitors.map((monitor) => {
        const StatusIcon = STATUS_ICON[monitor.status];
        return (
          <div
            key={monitor.key}
            id={`sp-monitor-${monitor.key}`}
            className='scroll-mt-6 border-b border-[var(--sp-card-divider)] px-5 py-5 last:border-b-0 @min-[640px]:px-6'
          >
            <div className='flex items-center justify-between gap-3'>
              <div className='flex min-w-0 items-center gap-2'>
                <StatusIcon
                  size={16}
                  className='flex-none'
                  style={{ color: STATUS_ICON_COLOR[monitor.status] }}
                  aria-hidden
                />
                <span className='truncate text-[15px] leading-none font-semibold text-[var(--sp-text)]'>
                  {monitor.publicName}
                </span>
              </div>
              <div className='flex flex-none items-center gap-3'>
                {monitor.uptime != null && (
                  <span
                    suppressHydrationWarning
                    className='hidden text-[13px] text-[var(--sp-muted)] @min-[640px]:inline'
                  >
                    {t('uptimeValue', { uptime: formatUptime(monitor.uptime, 'en') })}
                  </span>
                )}
                <span
                  className='rounded-full border px-3 py-1 text-xs font-semibold'
                  style={pillStyle(MONITOR_PILL_TONE[monitor.status])}
                >
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
              theme={data.theme}
            />
          </div>
        );
      })}
      {data.overallUptime != null && (
        <div
          suppressHydrationWarning
          className='border-t border-[var(--sp-card-divider)] bg-[var(--sp-card-footer-bg)] px-5 py-3.5 text-xs text-[var(--sp-muted)] @min-[640px]:px-6'
        >
          {t.rich('overallUptime', {
            uptime: formatUptime(data.overallUptime, 'en'),
            days: STATUS_PAGE_LIMITS.UPTIME_WINDOW_DAYS,
            value: (chunks) => <span className='font-semibold text-[var(--sp-text)]'>{chunks}</span>,
          })}
        </div>
      )}
    </div>
  );
}
