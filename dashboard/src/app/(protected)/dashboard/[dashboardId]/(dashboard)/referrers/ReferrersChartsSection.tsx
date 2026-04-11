'use client';

import ReferrerTrafficTrendChart from './ReferrerTrafficTrendChart';
import BAPieChart from '@/components/BAPieChart';
import { getReferrerColor } from '@/utils/referrerColors';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFilterClick } from '@/hooks/use-filter-click';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { QuerySection } from '@/components/QuerySection';
import { ChartSkeleton } from '@/components/skeleton';

export default function ReferrersChartsSection() {
  const { input, options } = useBAQueryParams();
  const distributionQuery = trpc.referrers.sourceAggregation.useQuery(input, options);
  const trendQuery = trpc.referrers.trafficTrend.useQuery(input, options);
  const { granularity } = useTimeRangeContext();
  const t = useTranslations('components.referrers.charts');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  if (distributionQuery.isPending || trendQuery.isPending) {
    return (
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  const distributionData = distributionQuery.data!;
  const trendResult = trendQuery.data!;

  return (
    <QuerySection loading={distributionQuery.isFetching || trendQuery.isFetching} distributed>
      <div className='grid grid-cols-1 gap-4 xl:grid-cols-8'>
        <QuerySection.Item className='xl:col-span-5'>
          <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
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
        </QuerySection.Item>
        <QuerySection.Item className='xl:col-span-3'>
          <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
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
        </QuerySection.Item>
      </div>
    </QuerySection>
  );
}
