'use client';

import { use } from 'react';
import BrowserTable from '@/components/analytics/BrowserTable';
import OperatingSystemTable from '@/components/analytics/OperatingSystemTable';
import { fetchBrowserBreakdownAction, fetchOperatingSystemBreakdownAction } from '@/app/actions/index.actions';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

type DevicesTablesSectionProps = {
  browserStatsPromise: ReturnType<typeof fetchBrowserBreakdownAction>;
  osStatsPromise: ReturnType<typeof fetchOperatingSystemBreakdownAction>;
};

export default function DevicesTablesSection({ browserStatsPromise, osStatsPromise }: DevicesTablesSectionProps) {
  const browserStats = use(browserStatsPromise);
  const osStats = use(osStatsPromise);
  const t = useTranslations('components.devices.tables');

  return (
    <div className='gap-section grid grid-cols-1 xl:grid-cols-2'>
      <Card variant='section' minHeight='chart'>
        <CardHeader>
          <CardTitle>{t('topOperatingSystems')}</CardTitle>
        </CardHeader>
        <CardContent>
          <OperatingSystemTable data={osStats} />
        </CardContent>
      </Card>
      <Card variant='section' minHeight='chart'>
        <CardHeader>
          <CardTitle>{t('topBrowsers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BrowserTable data={browserStats} />
        </CardContent>
      </Card>
    </div>
  );
}
