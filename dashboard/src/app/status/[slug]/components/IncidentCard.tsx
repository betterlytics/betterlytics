import { useTranslations } from 'next-intl';
import type {
  PublicStatusPageIncident,
  PublicStatusPageIncidentUpdate,
} from '@/entities/analytics/statusPage/publicStatusPage.entities';

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
// Timeline entries can span days, so each carries its own date + time (the header only shows the start).
const entryLabel = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

function statusColor(status: PublicStatusPageIncident['status']): string {
  return status === 'resolved' ? 'var(--sp-ok-text)' : 'var(--sp-warn-text)';
}

// Most-recent updates shown by default; older ones collapse into a <details> toggle.
const MAX_VISIBLE_UPDATES = 3;

export function IncidentCard({ incident }: { incident: PublicStatusPageIncident }) {
  const t = useTranslations('publicStatusPage');

  const ongoing = incident.resolvedAt == null;
  const durationMs =
    incident.resolvedAt != null
      ? new Date(incident.resolvedAt).getTime() - new Date(incident.startedAt).getTime()
      : null;
  const impactColor =
    incident.impact === 'outage'
      ? 'var(--sp-down-text)'
      : incident.impact === 'partial_outage'
        ? 'var(--sp-partial-text)'
        : 'var(--sp-warn-text)';

  const formatDuration = (ms: number) => {
    const minutes = Math.max(1, Math.round(ms / 60_000));
    if (minutes < 60) return t('duration.minutes', { count: minutes });
    const hours = Math.round(minutes / 60);
    if (hours < 24) return t('duration.hours', { count: hours });
    return t('duration.days', { count: Math.round(hours / 24) });
  };

  // Defensive fallback: a published incident should always have a seeded timeline, but synthesize one
  // from the body so the card never renders empty if updates are somehow missing.
  const updates: PublicStatusPageIncidentUpdate[] =
    incident.updates.length > 0
      ? incident.updates
      : [{ status: incident.status, message: incident.body, createdAt: incident.startedAt }];

  const visibleUpdates = updates.slice(0, MAX_VISIBLE_UPDATES);
  const hiddenUpdates = updates.slice(MAX_VISIBLE_UPDATES);

  // Timeline rail: a status-colored dot per entry with a connecting line down to the next, ringed in
  // the card bg so the line breaks cleanly around it. The line is omitted on the last entry of a list.
  const renderEntry = (update: PublicStatusPageIncidentUpdate, key: number, isLast: boolean) => (
    <li key={key} className='grid grid-cols-[18px_minmax(0,1fr)] gap-3 pb-4 last:pb-0'>
      <div className='relative'>
        {!isLast ? (
          <span
            className='absolute top-2.5 -bottom-6.5 left-2 w-0.5'
            style={{ background: 'var(--sp-card-border)' }}
          />
        ) : null}
        <span className='flex h-5 items-center'>
          <span
            className='relative z-10 ml-1 h-2.5 w-2.5 rounded-full'
            style={{ backgroundColor: statusColor(update.status), boxShadow: '0 0 0 3px var(--sp-card-bg)' }}
          />
        </span>
      </div>
      <div className='min-w-0'>
        <div className='flex items-baseline justify-between gap-2'>
          <span className='text-[13px] font-semibold' style={{ color: statusColor(update.status) }}>
            {t(`incident.status.${update.status}`)}
          </span>
          <span suppressHydrationWarning className='flex-none text-[11px] text-[var(--sp-faint)]'>
            {entryLabel.format(new Date(update.createdAt))}
          </span>
        </div>
        {update.message ? (
          <p className='mt-0.5 text-[13px] leading-relaxed whitespace-pre-line text-[var(--sp-muted)]'>
            {update.message}
          </p>
        ) : null}
      </div>
    </li>
  );

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

      {/* Change timeline, newest first. The most recent entries stay visible; older ones collapse. */}
      <ol className='relative mt-3.5'>
        {visibleUpdates.map((update, index) =>
          renderEntry(update, index, index === visibleUpdates.length - 1),
        )}
      </ol>

      {hiddenUpdates.length > 0 ? (
        <details className='group mt-2'>
          <summary className='inline-flex cursor-pointer list-none items-center gap-1 text-[12px] font-medium text-[var(--sp-muted)] [&::-webkit-details-marker]:hidden hover:text-[var(--sp-text)]'>
            <svg
              className='h-3 w-3 transition-transform group-open:rotate-180'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              aria-hidden='true'
            >
              <path d='m6 9 6 6 6-6' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
            <span className='group-open:hidden'>
              {t('incident.showMore', { count: hiddenUpdates.length })}
            </span>
            <span className='hidden group-open:inline'>{t('incident.showLess')}</span>
          </summary>
          <ol className='relative mt-3'>
            {hiddenUpdates.map((update, index) =>
              renderEntry(update, visibleUpdates.length + index, index === hiddenUpdates.length - 1),
            )}
          </ol>
        </details>
      ) : null}

      <div
        suppressHydrationWarning
        className='mt-3 text-[13px]'
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
}
