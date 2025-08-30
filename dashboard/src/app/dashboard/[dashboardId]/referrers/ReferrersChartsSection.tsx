'use client';

import { use } from 'react';
import ReferrerTrafficTrendChart from '@/app/dashboard/[dashboardId]/referrers/ReferrerTrafficTrendChart';
import {
  fetchReferrerSourceAggregationDataForSite,
  fetchReferrerTrafficTrendBySourceDataForSite,
} from '@/app/actions';
import BAPieChart from '@/components/BAPieChart';
import { getReferrerColor } from '@/utils/referrerColors';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useTranslations } from 'next-intl';

type ReferrersChartsSectionProps = {
  distributionPromise: ReturnType<typeof fetchReferrerSourceAggregationDataForSite>;
  trendPromise: ReturnType<typeof fetchReferrerTrafficTrendBySourceDataForSite>;
};

export default function ReferrersChartsSection({
  distributionPromise,
  trendPromise,
}: ReferrersChartsSectionProps) {
  const distributionResult = use(distributionPromise);
  const trendResult = use(trendPromise);
  const { granularity } = useTimeRangeContext();
  const t = useTranslations('components.referrers.charts');

  const distributionData = distributionResult.data;

  return (
    <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
      <div className='bg-card border-border rounded-lg border p-4 shadow'>
        <div className='text-foreground mb-2 font-medium'>{t('distribution')}</div>
        <p className='text-muted-foreground mb-4 text-xs'>{t('trafficByCategory')}</p>
        <BAPieChart data={distributionData} getColor={getReferrerColor} getLabel={capitalizeFirstLetter} />
      </div>
      <div className='bg-card border-border rounded-lg border p-4 shadow'>
        <div className='text-foreground mb-2 font-medium'>{t('trafficTrends')}</div>
        <p className='text-muted-foreground mb-4 text-xs'>{t('trafficBySourceOverTime')}</p>
        <ReferrerTrafficTrendChart
          chartData={trendResult.data}
          categories={trendResult.categories}
          comparisonMap={trendResult.comparisonMap}
          granularity={granularity}
        />
      </div>
    </div>
  );
}
