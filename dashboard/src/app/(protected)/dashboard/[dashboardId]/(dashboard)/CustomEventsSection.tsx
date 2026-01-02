'use client';

import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchCustomEventsOverviewAction } from '@/app/actions/analytics/events.actions';
import { use } from 'react';
import { useTranslations } from 'next-intl';
import { useFilterClick } from '@/hooks/use-filter-click';
import { TableGoToFooterLink } from './TableGoToFooterLink';

type CustomEventsSectionProps = {
  customEventsPromise: ReturnType<typeof fetchCustomEventsOverviewAction>;
};

export default function CustomEventsSection({ customEventsPromise }: CustomEventsSectionProps) {
  const customEvents = use(customEventsPromise);
  const t = useTranslations('dashboard');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  const onItemClick = (_tabKey: string, item: { label: string }) => {
    return makeFilterClick('custom_event_name')(item.label);
  };

  return (
    <MultiProgressTable
      title={t('sections.customEvents')}
      defaultTab='events'
      onItemClick={onItemClick}
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
      footer={<TableGoToFooterLink href='events' label={t('goTo', { section: t('sidebar.events') })} />}
    />
  );
}
