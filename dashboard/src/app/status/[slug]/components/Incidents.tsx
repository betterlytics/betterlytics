import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import type {
  PublicStatusPageData,
  PublicStatusPageIncident,
} from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { cn } from '@/lib/utils';
import { IncidentCard } from './IncidentCard';

// Past incidents stay collapsed behind a toggle and are capped at the most recent ones,
// so pages with a long history don't open onto a wall of resolved incidents.
const MAX_PAST_INCIDENTS = 10;

export function Incidents({ data }: { data: PublicStatusPageData }) {
  const t = useTranslations('publicStatusPage');
  const days = STATUS_PAGE_LIMITS.UPTIME_WINDOW_DAYS;
  const [pastExpanded, setPastExpanded] = useState(false);

  const all = data.incidents ?? [];
  const active = all.filter((incident) => incident.resolvedAt == null);
  // Newest first from the server, so slicing keeps the most recent ones.
  const past = all.filter((incident) => incident.resolvedAt != null).slice(0, MAX_PAST_INCIDENTS);

  // Lets an incident's affected-monitor chip scroll to that monitor's uptime row above.
  const monitorKeyByName = new Map(
    data.monitors.map((monitor): [string, string] => [monitor.publicName, monitor.key]),
  );

  const renderCards = (incidents: PublicStatusPageIncident[], keyPrefix: string) => (
    <div className='mt-3.5 flex flex-col gap-3'>
      {incidents.map((incident, index) => (
        <IncidentCard
          key={`${keyPrefix}-${incident.startedAt}-${index}`}
          incident={incident}
          monitorKeyByName={monitorKeyByName}
        />
      ))}
    </div>
  );

  return (
    <>
      {active.length > 0 && (
        <section className='mt-9'>
          <h2 className='text-[15px] font-bold text-[var(--sp-heading)]'>{t('activeIncidents')}</h2>
          {renderCards(active, 'active')}
        </section>
      )}

      {data.showPastIncidents && (
        <section className='mt-9'>
          {past.length === 0 ? (
            <>
              <h2 className='text-[15px] font-bold text-[var(--sp-heading)]'>{t('pastIncidents')}</h2>
              <p className='mt-3 text-center text-[13px] text-[var(--sp-muted)]'>
                {t('noPastIncidents', { days })}
              </p>
            </>
          ) : (
            <>
              {/* Grid-rows 0fr -> 1fr transition animates to the content's natural height. The heading
                  lives inside the fold so the collapsed state is just the centered toggle button. */}
              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-300 ease-in-out',
                  pastExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div
                  id='sp-past-incidents'
                  className={cn(
                    'min-h-0 overflow-hidden transition-opacity duration-300',
                    pastExpanded ? 'opacity-100' : 'opacity-0',
                  )}
                  aria-hidden={!pastExpanded}
                >
                  {/* Bottom gap lives on this child (not the clipped grid item), so the collapsed
                      0fr row is truly 0px tall — item padding would keep contributing height. */}
                  <div className='pb-4'>
                    <h2 className='text-[15px] font-bold text-[var(--sp-heading)]'>{t('pastIncidents')}</h2>
                    {renderCards(past, 'past')}
                  </div>
                </div>
              </div>
              <div className='flex justify-center'>
                <button
                  type='button'
                  onClick={() => setPastExpanded((value) => !value)}
                  aria-expanded={pastExpanded}
                  aria-controls='sp-past-incidents'
                  className='inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--sp-card-border)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--sp-muted-strong)] transition-colors hover:bg-[var(--sp-pill-neutral-bg)] hover:text-[var(--sp-text)]'
                >
                  <svg
                    className={cn('h-3.5 w-3.5 transition-transform', pastExpanded && 'rotate-180')}
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    aria-hidden='true'
                  >
                    <path d='m6 9 6 6 6-6' strokeLinecap='round' strokeLinejoin='round' />
                  </svg>
                  {pastExpanded ? t('hidePastIncidents') : t('showPastIncidents')}
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
