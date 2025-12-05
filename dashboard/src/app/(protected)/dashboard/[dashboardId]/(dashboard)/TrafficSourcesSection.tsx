'use client';

import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchTrafficSourcesCombinedAction } from '@/app/actions/analytics/referrers';
import { use } from 'react';
import { useTranslations } from 'next-intl';
import { FilterPreservingLink } from '@/components/ui/FilterPreservingLink';
import { ArrowRight } from 'lucide-react';
import { useFilterClick } from '@/hooks/use-filter-click';

type TrafficSourcesSectionProps = {
  trafficSourcesCombinedPromise: ReturnType<typeof fetchTrafficSourcesCombinedAction>;
};

export default function TrafficSourcesSection({ trafficSourcesCombinedPromise }: TrafficSourcesSectionProps) {
  const trafficSourcesCombined = use(trafficSourcesCombinedPromise);
  const t = useTranslations('dashboard');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  const onItemClick = (tabKey: string, item: { label: string }) => {
    if (tabKey === 'referrers') return makeFilterClick('referrer_url')(item.label);
    if (tabKey === 'sources') return makeFilterClick('referrer_source')(item.label);
    if (tabKey === 'channels') return makeFilterClick('referrer_source')(item.label);
  };

  const isItemInteractive = (tabKey: string) =>
    tabKey === 'referrers' || tabKey === 'sources' || tabKey === 'channels';

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
          data: trafficSourcesCombined.topReferrerUrls
            .filter((item) => item.referrer_url && item.referrer_url.trim() !== '')
            .map((item) => ({
              label: item.referrer_url,
              value: item.current.visits,
              trendPercentage: item.change?.visits,
              comparisonValue: item.compare?.visits,
            })),
        },
        {
          key: 'sources',
          label: t('tabs.sources'),
          data: trafficSourcesCombined.topReferrerSources.map((item) => ({
            label: item.referrer_source,
            value: item.current.visits,
            trendPercentage: item.change?.visits,
            comparisonValue: item.compare?.visits,
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
