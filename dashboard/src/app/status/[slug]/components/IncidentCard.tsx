import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  PublicStatusPageIncident,
  PublicStatusPageIncidentUpdate,
} from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { INCIDENT_STATUS_TONE, type IncidentStatusTone } from '@/components/statusPage/incidentStatusTone';
import { Timeline, TimelineItem } from '@/components/statusPage/Timeline';
import { pillStyle, type PillTone } from '@/components/statusPage/pillStyle';
import { useDisplayTimeZone } from '@/app/status/[slug]/useDisplayTimeZone';
import { useDisplayHour12 } from '@/hooks/use-display-hour12';
import { cn } from '@/lib/utils';

const STATUS_TONE_TEXT: Record<IncidentStatusTone, string> = {
  amber: 'var(--sp-warn-text)',
  orange: 'var(--sp-partial-text)',
  blue: 'var(--sp-info-text)',
  green: 'var(--sp-ok-text)',
};

function statusColor(status: PublicStatusPageIncident['status']): string {
  return STATUS_TONE_TEXT[INCIDENT_STATUS_TONE[status]];
}

const IMPACT_PILL_TONE: Record<PublicStatusPageIncident['impact'], PillTone> = {
  degraded: 'warn',
  partial_outage: 'partial',
  outage: 'down',
};

// Most-recent updates shown by default; older ones collapse behind a toggle.
const MAX_VISIBLE_UPDATES = 3;

// Smooth-scroll to a monitor's uptime row (rendered above by MonitorUptimeCard) and briefly
// flash it, so the visitor sees which monitor an affected-monitor chip refers to.
function scrollToMonitor(key: string) {
  const row = document.getElementById(`sp-monitor-${key}`);
  if (!row) return;
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  row.classList.remove('bl-monitor-flash');
  void row.offsetWidth; // restart the animation when the chip is clicked again
  row.classList.add('bl-monitor-flash');
}

export function IncidentCard({
  incident,
  monitorKeyByName,
}: {
  incident: PublicStatusPageIncident;
  monitorKeyByName?: Map<string, string>;
}) {
  const t = useTranslations('publicStatusPage');
  const timeZone = useDisplayTimeZone();
  const hour12 = useDisplayHour12();
  const [expanded, setExpanded] = useState(false);

  const fmt = useMemo(
    () => ({
      entry: new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12,
        timeZone,
      }),
      time: new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12, timeZone }),
      dayKey: new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone }),
    }),
    [timeZone, hour12],
  );

  const ongoing = incident.resolvedAt == null;
  const startedAt = new Date(incident.startedAt);
  // Resolved incidents show their total span; ongoing ones show how long they've run so far.
  const durationMs =
    (incident.resolvedAt != null ? new Date(incident.resolvedAt).getTime() : Date.now()) -
    startedAt.getTime();

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

  const hiddenCount = Math.max(0, updates.length - MAX_VISIBLE_UPDATES);
  const shownUpdates = expanded ? updates : updates.slice(0, MAX_VISIBLE_UPDATES);

  const firstDayKey = updates.length > 0 ? fmt.dayKey.format(new Date(updates[0].createdAt)) : '';
  const spansMultipleDays = updates.some(
    (update) => fmt.dayKey.format(new Date(update.createdAt)) !== firstDayKey,
  );

  const renderEntry = (update: PublicStatusPageIncidentUpdate, key: number, isLast: boolean) => {
    const entryDate = new Date(update.createdAt);
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
            className='flex h-5 items-center justify-end text-[11px] whitespace-nowrap text-[var(--sp-muted)] tabular-nums'
          >
            {spansMultipleDays ? fmt.entry.format(entryDate) : fmt.time.format(entryDate)}
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
          <p className='mt-0.5 text-[13px] leading-relaxed break-words whitespace-pre-line text-[var(--sp-muted)]'>
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
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <h3 className='text-[18px] leading-snug font-bold tracking-[-0.01em] break-words text-[var(--sp-text)]'>
            {incident.title}
          </h3>
          {/* Status strip: a state dot plus a one-line summary of how long the incident has run. */}
          <div
            suppressHydrationWarning
            className='mt-2 flex items-center gap-1.5 text-[13px] text-[var(--sp-muted-strong)]'
          >
            <span
              className='h-2 w-2 flex-none rounded-full'
              style={{ backgroundColor: ongoing ? 'var(--sp-warn)' : 'var(--sp-ok)' }}
            />
            <span>
              {ongoing
                ? t('incident.ongoing', {
                    duration: formatDuration(durationMs),
                    time: fmt.entry.format(startedAt),
                  })
                : t('incident.resolved', { duration: formatDuration(durationMs) })}
            </span>
          </div>
        </div>
        <span
          className='flex-none rounded-full border px-3 py-1 text-xs font-semibold'
          style={pillStyle(IMPACT_PILL_TONE[incident.impact])}
        >
          {t(`incident.impact.${incident.impact}`)}
        </span>
      </div>

      {/* Affected monitors, one chip per monitor. When the monitor is shown above, the chip
          links to and scrolls to its uptime row; otherwise it's a plain, non-interactive chip. */}
      {incident.monitorPublicNames.length > 0 ? (
        <div className='mt-3.5 flex flex-wrap gap-1.5'>
          {incident.monitorPublicNames.map((name) => {
            const monitorKey = monitorKeyByName?.get(name);
            const chipClass =
              'inline-flex items-center rounded-md border border-[var(--sp-pill-neutral-border)] bg-[var(--sp-pill-neutral-bg)] px-2 py-0.5 text-[12px] font-medium whitespace-nowrap text-[var(--sp-text)]';
            return monitorKey ? (
              <a
                key={name}
                href={`#sp-monitor-${monitorKey}`}
                onClick={(event) => {
                  event.preventDefault();
                  scrollToMonitor(monitorKey);
                }}
                className={cn(
                  chipClass,
                  'transition-colors hover:border-[var(--sp-muted)] hover:bg-[var(--sp-neutral)]',
                )}
              >
                {name}
              </a>
            ) : (
              <span key={name} className={chipClass}>
                {name}
              </span>
            );
          })}
        </div>
      ) : null}

      <div className='mt-4 mb-3.5 h-px bg-[var(--sp-card-divider)]' />

      {/* Change timeline, newest first. The most recent entries stay visible; older ones expand
          inline into the same timeline so the vertical line stays continuous. */}
      <Timeline>
        {shownUpdates.map((update, index) =>
          renderEntry(update, index, index === shownUpdates.length - 1),
        )}
      </Timeline>

      {hiddenCount > 0 ? (
        <button
          type='button'
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className='mt-2 inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-[var(--sp-muted)] transition-colors hover:text-[var(--sp-text)]'
        >
          <svg
            className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')}
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            aria-hidden='true'
          >
            <path d='m6 9 6 6 6-6' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
          {expanded ? t('incident.showLess') : t('incident.showMore', { count: hiddenCount })}
        </button>
      ) : null}
    </article>
  );
}
