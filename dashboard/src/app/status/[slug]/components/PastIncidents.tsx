import { useTranslations } from 'next-intl';
import { STATUS_PAGE_LIMITS, type PublicStatusPageData } from '@/entities/analytics/statusPage.entities';
import { IncidentCard } from './IncidentCard';

export function PastIncidents({ data }: { data: PublicStatusPageData }) {
  // Only resolved incidents belong here — open ones are shown by <ActiveIncidents />.
  const incidents = (data.incidents ?? []).filter((incident) => incident.resolvedAt != null);
  const t = useTranslations('publicStatusPage');
  const days = STATUS_PAGE_LIMITS.UPTIME_WINDOW_DAYS;

  return (
    <section className='mt-9'>
      <h2 className='text-[15px] font-bold text-[var(--sp-heading)]'>{t('pastIncidents')}</h2>
      {incidents.length === 0 ? (
        <p className='mt-3 text-center text-[13px] text-[var(--sp-faint)]'>{t('noIncidents', { days })}</p>
      ) : (
        <>
          <div className='mt-3.5 flex flex-col gap-3'>
            {incidents.map((incident, index) => (
              <IncidentCard key={`${incident.startedAt}-${index}`} incident={incident} />
            ))}
          </div>
          <p className='mt-3 text-center text-[13px] text-[var(--sp-faint)]'>{t('noOtherIncidents', { days })}</p>
        </>
      )}
    </section>
  );
}
