import { useTranslations } from 'next-intl';
import type { PublicStatusPageData } from '@/entities/analytics/statusPage.entities';
import { IncidentCard } from './IncidentCard';

export function ActiveIncidents({ data }: { data: PublicStatusPageData }) {
  // Unresolved published incidents are surfaced here, separate from the resolved "Past incidents"
  // list, so an open incident reads as current rather than historical.
  const incidents = (data.incidents ?? []).filter((incident) => incident.resolvedAt == null);

  const t = useTranslations('publicStatusPage');

  if (incidents.length === 0) return null;

  return (
    <section className='mt-9'>
      <h2 className='text-[15px] font-bold text-[var(--sp-heading)]'>{t('activeIncidents')}</h2>
      <div className='mt-3.5 flex flex-col gap-3'>
        {incidents.map((incident, index) => (
          <IncidentCard key={`${incident.startedAt}-${index}`} incident={incident} />
        ))}
      </div>
    </section>
  );
}
