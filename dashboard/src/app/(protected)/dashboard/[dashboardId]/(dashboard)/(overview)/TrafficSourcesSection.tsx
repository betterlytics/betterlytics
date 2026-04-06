'use client';

import MultiProgressTable from '@/components/MultiProgressTable';
import {
  fetchReferrerUrlRollupOverviewAction,
  fetchTopChannelsOverviewAction,
} from '@/app/actions/analytics/referrers.actions';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useFilterClick } from '@/hooks/use-filter-click';
import { useBAQuery } from '@/hooks/useBAQuery';
import { useState } from 'react';

export default function TrafficSourcesSection() {
  const [activeTab, setActiveTab] = useState('referrers');
  const t = useTranslations('dashboard');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  const referrersQuery = useBAQuery({
    queryKey: ['traffic-sources', 'referrers'],
    queryFn: (dashboardId, q) => fetchReferrerUrlRollupOverviewAction(dashboardId, q, 10),
    enabled: activeTab === 'referrers',
  });
  const channelsQuery = useBAQuery({
    queryKey: ['traffic-sources', 'channels'],
    queryFn: (dashboardId, q) => fetchTopChannelsOverviewAction(dashboardId, q, 10),
    enabled: activeTab === 'channels',
  });

  const onItemClick = (tabKey: string, item: { label: string; children?: unknown[] }) => {
    if (tabKey === 'referrers') {
      if (item.children) return;
      return makeFilterClick('referrer_url')(item.label);
    }
    if (tabKey === 'channels') return makeFilterClick('referrer_source')(item.label);
  };

  const activeQuery = { referrers: referrersQuery, channels: channelsQuery }[activeTab];

  const isItemInteractive = (tabKey: string) =>
    tabKey === 'referrers' || tabKey === 'channels';

  return (
      <MultiProgressTable
      title={t('sections.trafficSources')}
      loading={!!activeQuery?.isFetching && !!activeQuery?.data}
      defaultTab='referrers'
      onTabChange={setActiveTab}
      onItemClick={onItemClick}
      isItemInteractive={(tabKey) => isItemInteractive(tabKey)}
      tabs={[
        {
          key: 'referrers',
          label: t('tabs.referrers'),
          loading: referrersQuery.isFetching && !referrersQuery.data,
          data: (referrersQuery.data ?? []).map((item) => ({
            label: item.source_name,
            value: item.current.visitors,
            trendPercentage: item.change?.visitors,
            comparisonValue: item.compare?.visitors,
            children: item.children?.map((child) => ({
              label: child.referrer_url,
              value: child.current.visitors,
              trendPercentage: child.change?.visitors,
              comparisonValue: child.compare?.visitors,
            })),
          })),
        },
        {
          key: 'channels',
          label: t('tabs.channels'),
          loading: channelsQuery.isFetching && !channelsQuery.data,
          data: (channelsQuery.data ?? []).map((item) => ({
            label: item.channel,
            value: item.current.visits,
            trendPercentage: item.change?.visits,
            comparisonValue: item.compare?.visits,
          })),
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
