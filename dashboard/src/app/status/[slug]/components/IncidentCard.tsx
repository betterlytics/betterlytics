import { useTranslations } from 'next-intl';
import type {
  PublicStatusPageIncident,
  PublicStatusPageIncidentUpdate,
} from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { INCIDENT_STATUS_TONE, type IncidentStatusTone } from '@/components/statusPage/incidentStatusTone';
import { Timeline, TimelineItem } from '@/components/statusPage/Timeline';

const dateLabel = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const entryLabel = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

const timeLabel = new Intl.DateTimeFormat('en', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

function isSameUTCDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

const STATUS_TONE_TEXT: Record<IncidentStatusTone, string> = {
  amber: 'var(--sp-warn-text)',
  orange: 'var(--sp-partial-text)',
  blue: 'var(--sp-info-text)',
  green: 'var(--sp-ok-text)',
};

function statusColor(status: PublicStatusPageIncident['status']): string {
  return STATUS_TONE_TEXT[INCIDENT_STATUS_TONE[status]];
}

const IMPACT_PILL: Record<
  PublicStatusPageIncident['impact'],
  { color: string; background: string; borderColor: string }
> = {
  degraded: {
    color: 'var(--sp-pill-warn-text)',
    background: 'var(--sp-pill-warn-bg)',
    borderColor: 'var(--sp-pill-warn-border)',
  },
  partial_outage: {
    color: 'var(--sp-pill-partial-text)',
    background: 'var(--sp-pill-partial-bg)',
    borderColor: 'var(--sp-pill-partial-border)',
  },
  outage: {
    color: 'var(--sp-pill-down-text)',
    background: 'var(--sp-pill-down-bg)',
    borderColor: 'var(--sp-pill-down-border)',
  },
};

// Most-recent updates shown by default; older ones collapse into a <details> toggle.
const MAX_VISIBLE_UPDATES = 3;

export function IncidentCard({ incident }: { incident: PublicStatusPageIncident }) {
  const t = useTranslations('publicStatusPage');

  const ongoing = incident.resolvedAt == null;
  const startedAt = new Date(incident.startedAt);
  const durationMs =
    incident.resolvedAt != null ? new Date(incident.resolvedAt).getTime() - startedAt.getTime() : null;

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

  const meta = [incident.monitorPublicName, dateLabel.format(startedAt)].filter(Boolean).join(' · ');

  const renderEntry = (update: PublicStatusPageIncidentUpdate, key: number, isLast: boolean) => {
    const entryDate = new Date(update.createdAt);
    const showDate = !isSameUTCDay(entryDate, startedAt);
    return (
      <TimelineItem
        key={key}
        isLast={isLast}
        headHeightPx={20}
        spacingPx={16}
        lineClassName='bg-[var(--sp-card-border)]'
        leading={
          <span
            suppressHydrationWarning
            className='flex h-5 items-center text-[11px] tabular-nums whitespace-nowrap text-[var(--sp-faint)]'
          >
            {showDate ? entryLabel.format(entryDate) : timeLabel.format(entryDate)}
          </span>
        }
        dot={
          <span
            className='h-2.5 w-2.5 rounded-full'
            style={{ backgroundColor: statusColor(update.status), boxShadow: '0 0 0 3px var(--sp-card-bg)' }}
          />
        }
      >
        <div className='flex h-5 items-center'>
          <span className='text-[13px] font-semibold' style={{ color: statusColor(update.status) }}>
            {t(`incident.status.${update.status}`)}
          </span>
        </div>
        {update.message ? (
          <p className='mt-0.5 text-[13px] leading-relaxed whitespace-pre-line text-[var(--sp-muted)]'>
            {update.message}
          </p>
        ) : null}
      </TimelineItem>
    );
  };

  return (
    <article
      className='rounded-xl border bg-[var(--sp-card-bg)] px-5 py-4.5'
      style={{ borderColor: ongoing ? 'var(--sp-warn)' : 'var(--sp-card-border)' }}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h3 className='text-[15px] leading-snug font-semibold text-[var(--sp-text)]'>{incident.title}</h3>
          <div suppressHydrationWarning className='mt-0.5 text-xs text-[var(--sp-muted)]'>
            {meta}
          </div>
        </div>
        <span
          className='flex-none rounded-full border px-3 py-1 text-xs font-semibold'
          style={IMPACT_PILL[incident.impact]}
        >
          {t(`incident.impact.${incident.impact}`)}
        </span>
      </div>

      {/* Change timeline, newest first. The most recent entries stay visible; older ones collapse. */}
      <Timeline className='mt-3.5'>
        {visibleUpdates.map((update, index) =>
          renderEntry(update, index, index === visibleUpdates.length - 1),
        )}
      </Timeline>

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
          <Timeline className='mt-3'>
            {hiddenUpdates.map((update, index) =>
              renderEntry(update, visibleUpdates.length + index, index === hiddenUpdates.length - 1),
            )}
          </Timeline>
        </details>
      ) : null}

      <div
        suppressHydrationWarning
        className='mt-3 text-[13px]'
        style={{ color: ongoing ? 'var(--sp-warn-text)' : 'var(--sp-muted)' }}
      >
        {ongoing
          ? t('incident.ongoing', { time: entryLabel.format(startedAt) })
          : durationMs != null
            ? t('incident.resolved', { duration: formatDuration(durationMs) })
            : null}
      </div>
    </article>
  );
}
