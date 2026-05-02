'use client';

import MultiProgressTable from '@/components/MultiProgressTable';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useFilterClick } from '@/hooks/use-filter-click';
import { useState } from 'react';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';
import { isFilterColumn } from '@/entities/analytics/filter.entities';

export default function CustomEventsSection() {
  const [activeTab, setActiveTab] = useState('events');
  const { input, options } = useBAQueryParams();
  const { applyFilter } = useFilterClick({ behavior: 'replace-same-column' });
  const t = useTranslations('dashboard');

  const eventsQuery = trpc.events.customEventsOverview.useQuery(input, {
    ...options,
    enabled: activeTab === 'events',
  });
  const propertiesQuery = trpc.events.globalPropertiesOverview.useQuery(input, {
    ...options,
    enabled: activeTab === 'properties',
  });

  const eventsState = useQueryState(eventsQuery, activeTab === 'events');
  const propertiesState = useQueryState(propertiesQuery, activeTab === 'properties');
  const activeState = { events: eventsState, properties: propertiesState }[activeTab as 'events' | 'properties'];

  const onItemClick = (tabKey: string, item: { label: string; key?: string; children?: unknown[] }) => {
    if (tabKey === 'events') {
      return applyFilter('custom_event_name', item.label);
    }
    if (tabKey === 'properties' && item.key) {
      const [filterColumn] = item.key.split('::');
      if (isFilterColumn(filterColumn)) {
        return applyFilter(filterColumn, item.children?.length ? '*' : item.label);
      }
    }
  };

  return (
    <MultiProgressTable
      title={t('sections.events')}
      loading={activeState.refetching}
      defaultTab='events'
      onTabChange={setActiveTab}
      onItemClick={onItemClick}
      tabs={[
        {
          key: 'events',
          label: t('tabs.events'),
          loading: eventsState.loading,
          data: (eventsQuery.data ?? []).map((event) => ({
            label: event.event_name,
            value: event.current.count,
            trendPercentage: event.change?.count,
            comparisonValue: event.compare?.count,
          })),
        },
        {
          key: 'properties',
          label: t('tabs.topProperties'),
          loading: propertiesState.loading,
          data: (propertiesQuery.data ?? []).map((prop) => {
            const filterKey = `gp.${prop.property_key}`;
            return {
              key: filterKey,
              label: prop.property_key,
              value: prop.current.visitors,
              trendPercentage: prop.change?.percentage,
              comparisonValue: prop.compare?.visitors,
              children: prop.children.map((v) => ({
                key: `${filterKey}::${v.value}`,
                label: v.value,
                value: v.current.visitors,
                trendPercentage: v.change?.percentage,
                comparisonValue: v.compare?.visitors,
              })),
            };
          }),
        },
      ]}
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
