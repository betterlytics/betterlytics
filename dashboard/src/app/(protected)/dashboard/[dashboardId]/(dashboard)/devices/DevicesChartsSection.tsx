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

export default function DevicesChartsSection() {
  const { input, options } = useBAQueryParams();
  const breakdownQuery = trpc.devices.deviceTypeBreakdown.useQuery(input, options);
  const trendQuery = trpc.devices.usageTrend.useQuery(input, options);
  const { granularity } = useTimeRangeContext();
  const t = useTranslations('components.devices.charts');
  const { makeFilterClick } = useFilterClick({ behavior: 'replace-same-column' });

  if (breakdownQuery.isPending || trendQuery.isPending) return <ChartSkeleton />;

  return (
    <QuerySection loading={breakdownQuery.isFetching || trendQuery.isFetching} distributed>
      <div className='grid grid-cols-1 gap-3 xl:grid-cols-8'>
        <QuerySection.Item className='xl:col-span-5'>
          <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
            <CardHeader className='px-0 pb-0'>
              <CardTitle className='text-base font-medium'>{t('deviceUsageTrend')}</CardTitle>
            </CardHeader>
            <CardContent className='px-0'>
              <DeviceUsageTrendChart
                chartData={trendQuery.data!.data}
                categories={trendQuery.data!.categories}
                comparisonMap={trendQuery.data!.comparisonMap}
                granularity={granularity}
              />
            </CardContent>
          </Card>
        </QuerySection.Item>
        <QuerySection.Item className='xl:col-span-3'>
          <Card className='border-border flex h-full min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
            <CardHeader className='px-0 pb-0'>
              <CardTitle className='text-base font-medium'>{t('deviceTypes')}</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-1 flex-col px-0'>
              <BAPieChart
                data={breakdownQuery.data!}
                getColor={getDeviceColor}
                getLabel={getDeviceLabel}
                getIcon={(name: string) => <DeviceIcon type={name} className='h-4 w-4' />}
                onSliceClick={makeFilterClick('device_type')}
              />
            </CardContent>
          </Card>
        </QuerySection.Item>
      </div>
    </QuerySection>
  );
}
