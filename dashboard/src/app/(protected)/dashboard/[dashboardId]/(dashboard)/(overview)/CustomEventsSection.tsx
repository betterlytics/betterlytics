'use client';

import MultiProgressTable, { type ProgressBarData } from '@/components/MultiProgressTable';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useFilterClick } from '@/hooks/use-filter-click';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';
import { isFilterColumn } from '@/entities/analytics/filter.entities';

export default function CustomEventsSection() {
  const { input, options } = useBAQueryParams();
  const eventsQuery = trpc.events.customEventsOverview.useQuery(input, options);
  const propertiesQuery = trpc.events.globalPropertiesOverview.useQuery(input, options);
  const eventsState = useQueryState(eventsQuery);
  const propertiesState = useQueryState(propertiesQuery);
  const t = useTranslations('dashboard');
  const { applyFilter } = useFilterClick({ behavior: 'replace-same-column' });

  const properties = propertiesQuery.data ?? [];
  const loading = eventsState.refetching || propertiesState.refetching;

  const onItemClick = (tabKey: string, item: ProgressBarData) => {
    if (tabKey === 'events') {
      return applyFilter('custom_event_name', item.label);
    }
    if (tabKey === 'properties' && item.key && isFilterColumn(item.key)) {
      return applyFilter(item.key, item.children?.length ? '*' : item.label);
    }
  };

  const tabs = [
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
    ...(properties.length > 0
      ? [
          {
            key: 'properties',
            label: t('tabs.topProperties'),
            loading: propertiesState.loading,
            data: properties.map((prop) => {
              const filterKey = `gp.${prop.property_key}`;
              return {
                key: filterKey,
                label: prop.property_key,
                value: prop.current.count,
                trendPercentage: prop.change?.count,
                comparisonValue: prop.compare?.count,
                children: prop.children.map((v) => ({
                  key: filterKey,
                  label: v.value,
                  value: v.current.count,
                  trendPercentage: v.change?.count,
                  comparisonValue: v.compare?.count,
                })),
              };
            }),
          },
        ]
      : []),
  ];

  return (
    <MultiProgressTable
      title={t('sections.customEvents')}
      loading={loading}
      defaultTab='events'
      onItemClick={onItemClick}
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
