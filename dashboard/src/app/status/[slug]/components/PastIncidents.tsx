import { useTranslations } from 'next-intl';
import { STATUS_PAGE_LIMITS, type PublicStatusPageData } from '@/entities/analytics/statusPage.entities';

export function PastIncidents({ data }: { data: PublicStatusPageData }) {
  const incidents = data.incidents ?? [];
  const t = useTranslations('publicStatusPage');
  const days = STATUS_PAGE_LIMITS.UPTIME_WINDOW_DAYS;

  const dateLabel = new Intl.DateTimeFormat(data.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const timeLabel = new Intl.DateTimeFormat(data.language, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });

  const formatDuration = (durationMs: number) => {
    const minutes = Math.max(1, Math.round(durationMs / 60_000));
    if (minutes < 60) return t('duration.minutes', { count: minutes });
    const hours = Math.round(minutes / 60);
    if (hours < 24) return t('duration.hours', { count: hours });
    return t('duration.days', { count: Math.round(hours / 24) });
  };

  return (
    <section className='mt-9'>
      <h2 className='text-[15px] font-bold text-[var(--sp-heading)]'>{t('pastIncidents')}</h2>
      {incidents.length === 0 ? (
        <p className='mt-3 text-center text-[13px] text-[var(--sp-faint)]'>{t('noIncidents', { days })}</p>
      ) : (
        <>
          <div className='mt-3.5 flex flex-col gap-3'>
            {incidents.map((incident, index) => {
              const ongoing = incident.resolvedAt == null;
              const durationMs =
                incident.resolvedAt != null
                  ? new Date(incident.resolvedAt).getTime() - new Date(incident.startedAt).getTime()
                  : null;
              const impactColor = incident.impact === 'outage' ? 'var(--sp-down-text)' : 'var(--sp-warn-text)';

              return (
                <article
                  key={`${incident.startedAt}-${index}`}
                  className='rounded-xl border bg-[var(--sp-card-bg)] px-5 py-4.5'
                  style={{ borderColor: ongoing ? 'var(--sp-warn)' : 'var(--sp-card-border)' }}
                >
                  <div className='flex items-center justify-between gap-3'>
                    <div suppressHydrationWarning className='text-xs font-semibold text-[var(--sp-faint)]'>
                      {dateLabel.format(new Date(incident.startedAt)).toUpperCase()}
                    </div>
                    <span
                      className='rounded-full px-2 py-0.5 text-[11px] font-semibold'
                      style={{ color: impactColor, backgroundColor: 'color-mix(in srgb, currentColor 12%, transparent)' }}
                    >
                      {t(`incident.impact.${incident.impact}`)}
                    </span>
                  </div>
                  <div className='mt-1.5 text-sm font-semibold text-[var(--sp-text)]'>{incident.title}</div>
                  {incident.monitorPublicName ? (
                    <div className='text-xs text-[var(--sp-faint)]'>{incident.monitorPublicName}</div>
                  ) : null}
                  <p className='mt-1.5 text-[13px] leading-relaxed whitespace-pre-line text-[var(--sp-muted)]'>
                    {incident.body}
                  </p>
                  <div
                    suppressHydrationWarning
                    className='mt-2 text-[13px]'
                    style={{ color: ongoing ? 'var(--sp-warn-text)' : 'var(--sp-muted)' }}
                  >
                    {ongoing ? (
                      <>
                        {t(`incident.status.${incident.status}`)} ·{' '}
                        {t('incident.ongoing', { time: timeLabel.format(new Date(incident.startedAt)) })}
                      </>
                    ) : durationMs != null ? (
                      t('incident.resolved', { duration: formatDuration(durationMs) })
                    ) : (
                      t(`incident.status.${incident.status}`)
                    )}
                  </div>
                </article>
              );
            })}
          </div>
          <p className='mt-3 text-center text-[13px] text-[var(--sp-faint)]'>{t('noOtherIncidents', { days })}</p>
        </>
      )}
    </section>
  );
}
