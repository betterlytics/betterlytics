'use client';

import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchCustomEventsOverviewAction } from '@/app/actions/events';
import { use } from 'react';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

type CustomEventsSectionProps = {
  customEventsPromise: ReturnType<typeof fetchCustomEventsOverviewAction>;
};

export default function CustomEventsSection({ customEventsPromise }: CustomEventsSectionProps) {
  const customEvents = use(customEventsPromise);
  const { dictionary } = useDictionary();

  return (
    <MultiProgressTable
      title={dictionary.t('dashboard.sections.customEvents')}
      defaultTab='events'
      tabs={[
        {
          key: 'events',
          label: dictionary.t('dashboard.tabs.events'),
          data: customEvents.map((event) => ({
            label: event.event_name,
            value: event.current.count,
            trendPercentage: event.change?.count,
          })),
          emptyMessage: dictionary.t('dashboard.emptyStates.noCustomEventsData'),
        },
      ]}
    />
  );
}
