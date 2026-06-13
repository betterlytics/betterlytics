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
            {incidents.map((incident) => {
              const ongoing = incident.resolvedAt == null;
              const durationMs =
                incident.durationMs ??
                (incident.resolvedAt != null
                  ? new Date(incident.resolvedAt).getTime() - new Date(incident.startedAt).getTime()
                  : null);

              return (
                <article
                  key={`${incident.monitorPublicName}-${incident.startedAt}`}
                  className='rounded-xl border bg-[var(--sp-card-bg)] px-5 py-4.5'
                  style={{ borderColor: ongoing ? 'var(--sp-warn)' : 'var(--sp-card-border)' }}
                >
                  <div suppressHydrationWarning className='text-xs font-semibold text-[var(--sp-faint)]'>
                    {dateLabel.format(new Date(incident.startedAt)).toUpperCase()}
                  </div>
                  <div className='mt-1.5 text-sm font-semibold text-[var(--sp-text)]'>
                    {incident.monitorPublicName} — {t(`incident.cause.${incident.cause}`)}
                  </div>
                  <div
                    suppressHydrationWarning
                    className='mt-1 text-[13px] leading-relaxed'
                    style={{ color: ongoing ? 'var(--sp-warn-text)' : 'var(--sp-muted)' }}
                  >
                    {ongoing
                      ? t('incident.ongoing', { time: timeLabel.format(new Date(incident.startedAt)) })
                      : durationMs != null
                        ? t('incident.resolved', { duration: formatDuration(durationMs) })
                        : null}
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
