'use client';

import MultiProgressTable from '@/components/MultiProgressTable';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useFilterClick } from '@/hooks/use-filter-click';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';

export default function CustomEventsSection() {
  const { input, options } = useBAQueryParams();
  const query = trpc.events.customEventsOverview.useQuery(input, options);
  const eventState = useQueryState(query);
  const t = useTranslations('dashboard');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  const onItemClick = (_tabKey: string, item: { label: string }) => {
    return makeFilterClick('custom_event_name')(item.label);
  };

  return (
    <MultiProgressTable
      title={t('sections.customEvents')}
      loading={query.isFetching && !!query.data}
      defaultTab='events'
      onItemClick={onItemClick}
      tabs={[
        {
          key: 'events',
          label: t('tabs.events'),
          loading: eventState.loading,
          data: (query.data ?? []).map((event) => ({
            label: event.event_name,
            value: event.current.count,
            trendPercentage: event.change?.count,
            comparisonValue: event.compare?.count,
          })),
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
