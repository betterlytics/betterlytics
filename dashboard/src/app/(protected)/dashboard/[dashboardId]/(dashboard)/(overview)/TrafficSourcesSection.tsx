'use client';

import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchTrafficSourcesCombinedAction } from '@/app/actions/analytics/referrers.actions';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useFilterClick } from '@/hooks/use-filter-click';
import { useBASuspenseQuery } from '@/hooks/useBASuspenseQuery';

export default function TrafficSourcesSection() {
  const { data: trafficSourcesCombined } = useBASuspenseQuery({
    queryKey: ['traffic-sources'],
    queryFn: (dashboardId, query) => fetchTrafficSourcesCombinedAction(dashboardId, query, 10),
  });
  const t = useTranslations('dashboard');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  const onItemClick = (tabKey: string, item: { label: string; children?: unknown[] }) => {
    if (tabKey === 'referrers') {
      if (item.children) return;
      return makeFilterClick('referrer_url')(item.label);
    }
    if (tabKey === 'channels') return makeFilterClick('referrer_source')(item.label);
  };

  const isItemInteractive = (tabKey: string) =>
    tabKey === 'referrers' || tabKey === 'channels';

  return (
    <MultiProgressTable
      title={t('sections.trafficSources')}
      defaultTab='referrers'
      onItemClick={onItemClick}
      isItemInteractive={(tabKey) => isItemInteractive(tabKey)}
      tabs={[
        {
          key: 'referrers',
          label: t('tabs.referrers'),
          data: trafficSourcesCombined.topReferrerUrls.map((item) => ({
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
          data: trafficSourcesCombined.topChannels.map((item) => ({
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
