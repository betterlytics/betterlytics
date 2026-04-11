'use client';

import BrowserTable from '@/components/analytics/BrowserTable';
import OperatingSystemTable from '@/components/analytics/OperatingSystemTable';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBAQueryParams } from '@/trpc/hooks';
import { QuerySection, mergeQueries } from '@/components/QuerySection';
import { trpc } from '@/trpc/client';
import { TableSkeleton } from '@/components/skeleton';

export default function DevicesTablesSection() {
  const { input, options } = useBAQueryParams();
  const browserQuery = trpc.devices.browserBreakdown.useQuery(input, options);
  const osQuery = trpc.devices.osBreakdown.useQuery(input, options);
  const t = useTranslations('components.devices.tables');

  return (
    <QuerySection query={mergeQueries(browserQuery, osQuery)} fallback={<TableSkeleton />} distributed>
      {([browserData, osData]) => (
        <div className='grid grid-cols-1 gap-3 xl:grid-cols-2'>
          <QuerySection.Item>
            <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
              <CardHeader className='px-0 pb-0'>
                <CardTitle className='text-base font-medium'>{t('topOperatingSystems')}</CardTitle>
              </CardHeader>
              <CardContent className='px-0'>
                <OperatingSystemTable data={osData} />
              </CardContent>
            </Card>
          </QuerySection.Item>
          <QuerySection.Item>
            <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
              <CardHeader className='px-0 pb-0'>
                <CardTitle className='text-base font-medium'>{t('topBrowsers')}</CardTitle>
              </CardHeader>
              <CardContent className='px-0'>
                <BrowserTable data={browserData} />
              </CardContent>
            </Card>
          </QuerySection.Item>
        </div>
      )}
    </QuerySection>
  );
}
