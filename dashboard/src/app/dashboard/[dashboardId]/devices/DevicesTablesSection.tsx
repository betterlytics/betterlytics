'use client';

import { use } from 'react';
import BrowserTable from '@/components/analytics/BrowserTable';
import OperatingSystemTable from '@/components/analytics/OperatingSystemTable';
import { fetchBrowserBreakdownAction, fetchOperatingSystemBreakdownAction } from '@/app/actions';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DevicesTablesSectionProps = {
  browserStatsPromise: ReturnType<typeof fetchBrowserBreakdownAction>;
  osStatsPromise: ReturnType<typeof fetchOperatingSystemBreakdownAction>;
};

export default function DevicesTablesSection({ browserStatsPromise, osStatsPromise }: DevicesTablesSectionProps) {
  const browserStats = use(browserStatsPromise);
  const osStats = use(osStatsPromise);
  const t = useTranslations('components.devices.tables');

  return (
    <div className='grid grid-cols-1 gap-3 xl:grid-cols-2'>
      <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
        <CardHeader className='px-0 pb-0'>
          <CardTitle className='text-base font-medium'>{t('topOperatingSystems')}</CardTitle>
        </CardHeader>
        <CardContent className='px-0'>
          <OperatingSystemTable data={osStats} />
        </CardContent>
      </Card>
      <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
        <CardHeader className='px-0 pb-0'>
          <CardTitle className='text-base font-medium'>{t('topBrowsers')}</CardTitle>
        </CardHeader>
        <CardContent className='px-0'>
          <BrowserTable data={browserStats} />
        </CardContent>
      </Card>
    </div>
  );
}
