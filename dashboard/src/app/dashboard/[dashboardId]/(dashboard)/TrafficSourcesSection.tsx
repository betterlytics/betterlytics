'use client';

import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchTrafficSourcesCombinedAction } from '@/app/actions/referrers';
import { use } from 'react';
import { useTranslations } from 'next-intl';

type TrafficSourcesSectionProps = {
  trafficSourcesCombinedPromise: ReturnType<typeof fetchTrafficSourcesCombinedAction>;
};

export default function TrafficSourcesSection({ trafficSourcesCombinedPromise }: TrafficSourcesSectionProps) {
  const trafficSourcesCombined = use(trafficSourcesCombinedPromise);
  const t = useTranslations('dashboard');

  return (
    <MultiProgressTable
      title={t('sections.trafficSources')}
      defaultTab='referrers'
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
          emptyMessage: t('emptyStates.noReferrerData'),
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
          emptyMessage: t('emptyStates.noSourceData'),
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
          emptyMessage: t('emptyStates.noChannelData'),
        },
      ]}
    />
  );
}
