'use client';

import MultiProgressTable from '@/components/MultiProgressTable';
import { fetchTrafficSourcesCombinedAction } from '@/app/actions/referrers';
import { use } from 'react';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

type TrafficSourcesSectionProps = {
  trafficSourcesCombinedPromise: ReturnType<typeof fetchTrafficSourcesCombinedAction>;
};

export default function TrafficSourcesSection({ trafficSourcesCombinedPromise }: TrafficSourcesSectionProps) {
  const trafficSourcesCombined = use(trafficSourcesCombinedPromise);
  const { dictionary } = useDictionary();

  return (
    <MultiProgressTable
      title={dictionary.t('dashboard.sections.trafficSources')}
      defaultTab='referrers'
      tabs={[
        {
          key: 'referrers',
          label: dictionary.t('dashboard.tabs.referrers'),
          data: trafficSourcesCombined.topReferrerUrls
            .filter((item) => item.referrer_url && item.referrer_url.trim() !== '')
            .map((item) => ({
              label: item.referrer_url,
              value: item.current.visits,
              trendPercentage: item.change?.visits,
              comparisonValue: item.compare?.visits,
            })),
          emptyMessage: dictionary.t('dashboard.emptyStates.noReferrerData'),
        },
        {
          key: 'sources',
          label: dictionary.t('dashboard.tabs.sources'),
          data: trafficSourcesCombined.topReferrerSources.map((item) => ({
            label: item.referrer_source,
            value: item.current.visits,
            trendPercentage: item.change?.visits,
            comparisonValue: item.compare?.visits,
          })),
          emptyMessage: dictionary.t('dashboard.emptyStates.noSourceData'),
        },
        {
          key: 'channels',
          label: dictionary.t('dashboard.tabs.channels'),
          data: trafficSourcesCombined.topChannels.map((item) => ({
            label: item.channel,
            value: item.current.visits,
            trendPercentage: item.change?.visits,
            comparisonValue: item.compare?.visits,
          })),
          emptyMessage: dictionary.t('dashboard.emptyStates.noChannelData'),
        },
      ]}
    />
  );
}
