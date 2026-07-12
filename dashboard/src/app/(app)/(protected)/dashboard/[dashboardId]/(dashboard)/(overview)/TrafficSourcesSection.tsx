'use client';

import MultiProgressTable, { type ProgressBarData } from '@/components/MultiProgressTable';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useProgressTableFilterClick } from '@/hooks/use-progress-table-filter-click';
import { useState } from 'react';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';

export default function TrafficSourcesSection() {
  const [activeTab, setActiveTab] = useState('referrers');
  const t = useTranslations('dashboard');
  const { onItemClick, isItemInteractive } = useProgressTableFilterClick();
  const { input, options } = useBAQueryParams();

  const referrersQuery = trpc.referrers.referrerUrlRollup.useQuery(input, {
    ...options,
    enabled: activeTab === 'referrers',
  });
  const channelsQuery = trpc.referrers.topChannels.useQuery(input, {
    ...options,
    enabled: activeTab === 'channels',
  });

  const referrersState = useQueryState(referrersQuery, activeTab === 'referrers');
  const channelsState = useQueryState(channelsQuery, activeTab === 'channels');
  const activeState = { referrers: referrersState, channels: channelsState }[
    activeTab as 'referrers' | 'channels'
  ];

  return (
    <MultiProgressTable
      title={t('sections.trafficSources')}
      loading={activeState.refetching}
      defaultTab='referrers'
      onTabChange={setActiveTab}
      onItemClick={onItemClick}
      isItemInteractive={isItemInteractive}
      tabs={[
        {
          key: 'referrers',
          label: t('tabs.referrers'),
          loading: referrersState.loading,
          data: (referrersQuery.data ?? []).map(
            (item): ProgressBarData => ({
              label: item.source_name,
              value: item.current.visitors,
              trendPercentage: item.change?.visitors,
              comparisonValue: item.compare?.visitors,
              filterColumn: 'referrer_source_name',
              children: item.children?.map(
                (child): ProgressBarData => ({
                  label: child.referrer_url,
                  value: child.current.visitors,
                  trendPercentage: child.change?.visitors,
                  comparisonValue: child.compare?.visitors,
                  filterColumn: 'referrer_url',
                }),
              ),
            }),
          ),
        },
        {
          key: 'channels',
          label: t('tabs.channels'),
          loading: channelsState.loading,
          data: (channelsQuery.data ?? []).map(
            (item): ProgressBarData => ({
              label: item.channel,
              value: item.current.visits,
              trendPercentage: item.change?.visits,
              comparisonValue: item.compare?.visits,
              filterColumn: 'referrer_source',
            }),
          ),
        },
      ]}
      footer={
        <FilterPreservingLink
          href='referrers'
          className='text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline'
        >
          <span>{t('goTo', { section: t('sidebar.referrers') })}</span>
          <ArrowRight className='h-3.5 w-3.5' />
        </FilterPreservingLink>
      }
    />
  );
}
