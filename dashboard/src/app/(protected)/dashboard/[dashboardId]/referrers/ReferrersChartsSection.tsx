'use client';

import { use } from 'react';
import ReferrerTrafficTrendChart from '@/app/(protected)/dashboard/[dashboardId]/referrers/ReferrerTrafficTrendChart';
import {
  fetchReferrerSourceAggregationDataForSite,
  fetchReferrerTrafficTrendBySourceDataForSite,
} from '@/app/actions/index.actions';
import BAPieChart from '@/components/BAPieChart';
import { getReferrerColor } from '@/utils/referrerColors';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Grid } from '@/components/layout';
import { useFilterClick } from '@/hooks/use-filter-click';

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
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  return (
    <Grid cols={{ base: 1, xl: 8 }}>
      <Card variant='section' minHeight='chart' className='xl:col-span-5'>
        <CardHeader>
          <CardTitle>{t('trafficTrends')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReferrerTrafficTrendChart
            chartData={trendResult.data}
            categories={trendResult.categories}
            comparisonMap={trendResult.comparisonMap}
            granularity={granularity}
          />
        </CardContent>
      </Card>
      <Card variant='section' minHeight='chart' className='xl:col-span-3'>
        <CardHeader>
          <CardTitle>{t('distribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BAPieChart
            data={distributionData}
            getColor={getReferrerColor}
            getLabel={capitalizeFirstLetter}
            onSliceClick={makeFilterClick('referrer_source')}
          />
        </CardContent>
      </Card>
    </Grid>
  );
}
