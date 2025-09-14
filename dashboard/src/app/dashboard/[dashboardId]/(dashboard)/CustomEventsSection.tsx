'use client';

import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchCustomEventsOverviewAction } from '@/app/actions/events';
import { use } from 'react';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { ArrowRight } from 'lucide-react';

type CustomEventsSectionProps = {
  customEventsPromise: ReturnType<typeof fetchCustomEventsOverviewAction>;
};

export default function CustomEventsSection({ customEventsPromise }: CustomEventsSectionProps) {
  const customEvents = use(customEventsPromise);
  const t = useTranslations('dashboard');
  const dashboardId = useDashboardId();

  return (
    <MultiProgressTable
      title={t('sections.customEvents')}
      defaultTab='events'
      tabs={[
        {
          key: 'events',
          label: t('tabs.events'),
          data: customEvents.map((event) => ({
            label: event.event_name,
            value: event.current.count,
            trendPercentage: event.change?.count,
            comparisonValue: event.compare?.count,
          })),
        },
      ]}
      footer={
        <FilterPreservingLink
          href={`/dashboard/${dashboardId}/events`}
          className='text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline'
        >
          <span>{t('goTo', { section: t('sidebar.events') })}</span>
          <ArrowRight className='h-3.5 w-3.5' />
        </FilterPreservingLink>
      }
    />
  );
}
