'use client';

import { use } from 'react';
import BrowserTable from '@/components/analytics/BrowserTable';
import OperatingSystemTable from '@/components/analytics/OperatingSystemTable';
import { fetchBrowserBreakdownAction, fetchOperatingSystemBreakdownAction } from '@/app/actions/index.actions';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Grid } from '@/components/layout';

type DevicesTablesSectionProps = {
  browserStatsPromise: ReturnType<typeof fetchBrowserBreakdownAction>;
  osStatsPromise: ReturnType<typeof fetchOperatingSystemBreakdownAction>;
};

export default function DevicesTablesSection({ browserStatsPromise, osStatsPromise }: DevicesTablesSectionProps) {
  const browserStats = use(browserStatsPromise);
  const osStats = use(osStatsPromise);
  const t = useTranslations('components.devices.tables');

  return (
    <Grid cols={{ base: 1, xl: 2 }}>
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
    </Grid>
  );
}
