'use client';

import DeviceUsageTrendChart from './DeviceUsageTrendChart';
import BAPieChart from '@/components/BAPieChart';
import { getDeviceColor, getDeviceLabel } from '@/constants/deviceTypes';
import { DeviceIcon } from '@/components/icons';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFilterClick } from '@/hooks/use-filter-click';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { QuerySection } from '@/components/QuerySection';
import { ChartSkeleton } from '@/components/skeleton';
import { useQueryState } from '@/hooks/use-query-state';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export default function DevicesChartsSection() {
  const { input, options } = useBAQueryParams();
  const breakdownQuery = trpc.devices.deviceTypeBreakdown.useQuery(input, options);
  const trendQuery = trpc.devices.usageTrend.useQuery(input, options);
  const { loading: breakdownLoading, refetching: breakdownRefetching } = useQueryState(breakdownQuery);
  const { granularity } = useTimeRangeContext();
  const t = useTranslations('components.devices.charts');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  return (
    <div className='grid grid-cols-1 gap-3 xl:grid-cols-8'>
      <div className='xl:col-span-5'>
        <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
          <CardHeader className='px-0 pb-0'>
            <CardTitle className='text-base font-medium'>{t('deviceUsageTrend')}</CardTitle>
          </CardHeader>
          <CardContent className='px-0'>
            <QuerySection query={trendQuery} fallback={<ChartSkeleton chartOnly />}>
              {(trend) => (
                <DeviceUsageTrendChart
                  chartData={trend.data}
                  categories={trend.categories}
                  comparisonMap={trend.comparisonMap}
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
            <CardTitle className='text-base font-medium'>{t('deviceTypes')}</CardTitle>
          </CardHeader>
          <CardContent className='relative flex flex-1 flex-col px-0'>
            {breakdownRefetching && (
              <div className='absolute inset-0 z-10 flex items-center justify-center'>
                <Spinner />
              </div>
            )}
            <div className={cn(breakdownRefetching && 'pointer-events-none opacity-60', 'flex flex-1 flex-col')}>
              <BAPieChart
                data={breakdownQuery.data ?? []}
                loading={breakdownLoading}
                getColor={getDeviceColor}
                getLabel={getDeviceLabel}
                getIcon={(name: string) => <DeviceIcon type={name} className='h-4 w-4' />}
                onSliceClick={makeFilterClick('device_type')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
