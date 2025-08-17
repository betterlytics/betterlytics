'use client';

import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchCustomEventsOverviewAction } from '@/app/actions/events';
import { use } from 'react';
import { useTranslations } from 'next-intl';

type CustomEventsSectionProps = {
  customEventsPromise: ReturnType<typeof fetchCustomEventsOverviewAction>;
};

export default function CustomEventsSection({ customEventsPromise }: CustomEventsSectionProps) {
  const customEvents = use(customEventsPromise);
  const t = useTranslations('dashboard');

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
          emptyMessage: t('emptyStates.noCustomEventsData'),
        },
      ]}
    />
  );
}
