'use client';

import ReferrerTrafficTrendChart from './ReferrerTrafficTrendChart';
import {
  fetchReferrerSourceAggregationDataForSite,
  fetchReferrerTrafficTrendBySourceDataForSite,
} from '@/app/actions/index.actions';
import BAPieChart from '@/components/BAPieChart';
import { getReferrerColor } from '@/utils/referrerColors';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFilterClick } from '@/hooks/use-filter-click';
import { useBASuspenseQuery } from '@/hooks/useBASuspenseQuery';

export default function ReferrersChartsSection() {
  const { data: distributionResult } = useBASuspenseQuery({
    queryKey: ['referrer-source-aggregation'],
    queryFn: (dashboardId, query) => fetchReferrerSourceAggregationDataForSite(dashboardId, query),
  });
  const { data: trendResult } = useBASuspenseQuery({
    queryKey: ['referrer-traffic-trend'],
    queryFn: (dashboardId, query) => fetchReferrerTrafficTrendBySourceDataForSite(dashboardId, query),
  });
  const { granularity } = useTimeRangeContext();
  const t = useTranslations('components.referrers.charts');

  const distributionData = distributionResult.data;
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  return (
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-8'>
      <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4 xl:col-span-5'>
        <CardHeader className='px-0 pb-0'>
          <CardTitle className='text-base font-medium'>{t('trafficTrends')}</CardTitle>
        </CardHeader>
        <CardContent className='px-0'>
          <ReferrerTrafficTrendChart
            chartData={trendResult.data}
            categories={trendResult.categories}
            comparisonMap={trendResult.comparisonMap}
            granularity={granularity}
          />
        </CardContent>
      </Card>
      <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4 xl:col-span-3'>
        <CardHeader className='px-0 pb-0'>
          <CardTitle className='text-base font-medium'>{t('distribution')}</CardTitle>
        </CardHeader>
        <CardContent className='flex flex-1 flex-col px-0'>
          <BAPieChart
            data={distributionData}
            getColor={getReferrerColor}
            getLabel={capitalizeFirstLetter}
            onSliceClick={makeFilterClick('referrer_source')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
