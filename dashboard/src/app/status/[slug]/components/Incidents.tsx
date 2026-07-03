import { useTranslations } from 'next-intl';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import type {
  PublicStatusPageData,
  PublicStatusPageIncident,
} from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { IncidentCard } from './IncidentCard';

export function Incidents({ data }: { data: PublicStatusPageData }) {
  const t = useTranslations('publicStatusPage');
  const days = STATUS_PAGE_LIMITS.UPTIME_WINDOW_DAYS;

  const all = data.incidents ?? [];
  const active = all.filter((incident) => incident.resolvedAt == null);
  const past = all.filter((incident) => incident.resolvedAt != null);

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
          <h2 className='text-[15px] font-bold text-[var(--sp-heading)]'>{t('pastIncidents')}</h2>
          {past.length === 0 ? (
            <p className='mt-3 text-center text-[13px] text-[var(--sp-faint)]'>
              {t('noPastIncidents', { days })}
            </p>
          ) : (
            renderCards(past, 'past')
          )}
        </section>
      )}
    </>
  );
}
