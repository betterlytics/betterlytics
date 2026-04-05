'use client';

import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchEventsAndPropertiesAction } from '@/app/actions/analytics/events.actions';
import { use } from 'react';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useFilterClick } from '@/hooks/use-filter-click';

type CustomEventsSectionProps = {
  eventsAndPropertiesPromise: ReturnType<typeof fetchEventsAndPropertiesAction>;
};

export default function CustomEventsSection({ eventsAndPropertiesPromise }: CustomEventsSectionProps) {
  const { events, properties } = use(eventsAndPropertiesPromise);
  const t = useTranslations('dashboard');
  const { applyFilter } = useFilterClick({ behavior: 'replace-same-column' });

  type EventItem = { label: string; value: number; parentPropertyKey?: string };

  const onItemClick = (tabKey: string, item: EventItem) => {
    if (tabKey === 'events') {
      applyFilter('custom_event_name', item.label);
    } else if (tabKey === 'properties' && item.parentPropertyKey) {
      applyFilter('global_property', item.label, { propertyKey: item.parentPropertyKey });
    } else if (tabKey === 'properties') {
      applyFilter('global_property', item.label, { propertyKey: item.label });
    }
  };

  const tabs = [
    {
      key: 'events',
      label: t('tabs.events'),
      data: events.map((event) => ({
        label: event.event_name,
        value: event.current.count,
        trendPercentage: event.change?.count,
        comparisonValue: event.compare?.count,
      })),
    },
    ...(properties.length > 0
      ? [
          {
            key: 'properties',
            label: t('tabs.topProperties'),
            data: properties.map((prop) => ({
              label: prop.property_key,
              value: prop.current.count,
              trendPercentage: prop.change?.count,
              comparisonValue: prop.compare?.count,
              children: prop.current.values.map((v) => ({
                label: v.value,
                value: v.count,
                parentPropertyKey: prop.property_key,
              })),
            })),
          },
        ]
      : []),
  ];

  return (
    <MultiProgressTable
      title={t('sections.customEvents')}
      defaultTab='events'
      onItemClick={onItemClick}
      isItemInteractive={isItemInteractive}
      tabs={tabs}
      footer={
        <FilterPreservingLink
          href='events'
          className='text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline'
        >
          <span>{t('goTo', { section: t('sidebar.events') })}</span>
          <ArrowRight className='h-3.5 w-3.5' />
        </FilterPreservingLink>
      }
    />
  );
}
