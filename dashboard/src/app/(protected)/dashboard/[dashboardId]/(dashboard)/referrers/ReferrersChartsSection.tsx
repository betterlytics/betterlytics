'use client';

import ReferrerTrafficTrendChart from './ReferrerTrafficTrendChart';
import BAPieChart from '@/components/BAPieChart';
import { getReferrerColor } from '@/utils/referrerColors';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFilterClick } from '@/hooks/use-filter-click';
import { QuerySection } from '@/components/QuerySection';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryState } from '@/hooks/use-query-state';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export default function ReferrersChartsSection() {
  const { input, options } = useBAQueryParams();
  const distributionQuery = trpc.referrers.sourceAggregation.useQuery(input, options);
  const trendQuery = trpc.referrers.trafficTrend.useQuery(input, options);
  const { loading: distributionLoading, refetching: distributionRefetching } = useQueryState(distributionQuery);
  const { granularity } = useTimeRangeContext();
  const t = useTranslations('components.referrers.charts');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  return (
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-8'>
      <div className='xl:col-span-5'>
        <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
          <CardHeader className='px-0 pb-0'>
            <CardTitle className='text-base font-medium'>{t('trafficTrends')}</CardTitle>
          </CardHeader>
          <CardContent className='px-0'>
            <QuerySection query={trendQuery} fallback={<Skeleton className='mt-10 h-[300px] w-full' />}>
              {(trendResult) => (
                <ReferrerTrafficTrendChart
                  chartData={trendResult.data}
                  categories={trendResult.categories}
                  comparisonMap={trendResult.comparisonMap}
                  granularity={granularity}
                />
              )}
            </QuerySection>
          </CardContent>
        </Card>
      </div>
      <div className='xl:col-span-3'>
        <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
          <CardHeader className='px-0 pb-0'>
            <CardTitle className='text-base font-medium'>{t('distribution')}</CardTitle>
          </CardHeader>
          <CardContent className='relative flex flex-1 flex-col px-0'>
            {distributionRefetching && (
              <div className='absolute inset-0 z-10 flex items-center justify-center'>
                <Spinner />
              </div>
            )}
            <div className={cn(distributionRefetching && 'pointer-events-none opacity-60', 'flex flex-1 flex-col')}>
              <BAPieChart
                data={distributionQuery.data ?? []}
                loading={distributionLoading}
                getColor={getReferrerColor}
                getLabel={capitalizeFirstLetter}
                onSliceClick={makeFilterClick('referrer_source')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
