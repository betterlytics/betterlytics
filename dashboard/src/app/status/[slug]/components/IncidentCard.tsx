import { useTranslations } from 'next-intl';
import type { PublicStatusPageIncident } from '@/entities/analytics/statusPage.entities';

const dateLabel = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const timeLabel = new Intl.DateTimeFormat('en', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

export function IncidentCard({ incident }: { incident: PublicStatusPageIncident }) {
  const t = useTranslations('publicStatusPage');

  const ongoing = incident.resolvedAt == null;
  const durationMs =
    incident.resolvedAt != null
      ? new Date(incident.resolvedAt).getTime() - new Date(incident.startedAt).getTime()
      : null;
  const impactColor = incident.impact === 'outage' ? 'var(--sp-down-text)' : 'var(--sp-warn-text)';

  const formatDuration = (ms: number) => {
    const minutes = Math.max(1, Math.round(ms / 60_000));
    if (minutes < 60) return t('duration.minutes', { count: minutes });
    const hours = Math.round(minutes / 60);
    if (hours < 24) return t('duration.hours', { count: hours });
    return t('duration.days', { count: Math.round(hours / 24) });
  };

  return (
    <article
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
      <p className='mt-1.5 text-[13px] leading-relaxed whitespace-pre-line text-[var(--sp-muted)]'>{incident.body}</p>
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
}
