'use client';

import BrowserTable from '@/components/analytics/BrowserTable';
import OperatingSystemTable from '@/components/analytics/OperatingSystemTable';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export default function DevicesTablesSection() {
  const { input, options } = useBAQueryParams();
  const browserQuery = trpc.devices.browserBreakdown.useQuery(input, options);
  const osQuery = trpc.devices.osBreakdown.useQuery(input, options);
  const t = useTranslations('components.devices.tables');

  const { data: osData, loading: osLoading, refetching: osRefetching } = useQueryState(osQuery);
  const { data: browserData, loading: browserLoading, refetching: browserRefetching } = useQueryState(browserQuery);

  return (
    <div className='grid grid-cols-1 gap-3 xl:grid-cols-2'>
      <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
        <CardHeader className='px-0 pb-0'>
          <CardTitle className='text-base font-medium'>{t('topOperatingSystems')}</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto px-0'>
          <div className='relative'>
            {osRefetching && (
              <div className='absolute inset-0 z-10 flex items-center justify-center'>
                <Spinner />
              </div>
            )}
            <div className={cn(osRefetching && 'pointer-events-none opacity-60')}>
              <OperatingSystemTable data={osData ?? []} loading={osLoading} />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
        <CardHeader className='px-0 pb-0'>
          <CardTitle className='text-base font-medium'>{t('topBrowsers')}</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto px-0'>
          <div className='relative'>
            {browserRefetching && (
              <div className='absolute inset-0 z-10 flex items-center justify-center'>
                <Spinner />
              </div>
            )}
            <div className={cn(browserRefetching && 'pointer-events-none opacity-60')}>
              <BrowserTable data={browserData ?? []} loading={browserLoading} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
