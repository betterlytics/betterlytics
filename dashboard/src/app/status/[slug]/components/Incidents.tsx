import { useTranslations } from 'next-intl';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import type { PublicStatusPageData } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { IncidentCard } from './IncidentCard';

export function Incidents({ data }: { data: PublicStatusPageData }) {
  const t = useTranslations('publicStatusPage');
  const days = STATUS_PAGE_LIMITS.UPTIME_WINDOW_DAYS;

  // One unified list: unresolved incidents lead (they read as current), resolved ones follow. Each
  // card self-describes its state via its border + footer, so no separate active/past headings.
  const all = data.incidents ?? [];
  const incidents = [
    ...all.filter((incident) => incident.resolvedAt == null),
    ...all.filter((incident) => incident.resolvedAt != null),
  ];

  return (
    <section className='mt-9'>
      <h2 className='text-[15px] font-bold text-[var(--sp-heading)]'>{t('incidents')}</h2>
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
