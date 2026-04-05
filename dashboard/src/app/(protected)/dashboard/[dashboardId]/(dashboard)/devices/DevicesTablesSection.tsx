'use client';

import BrowserTable from '@/components/analytics/BrowserTable';
import OperatingSystemTable from '@/components/analytics/OperatingSystemTable';
import { fetchBrowserBreakdownAction, fetchOperatingSystemBreakdownAction } from '@/app/actions/index.actions';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBAQuery } from '@/hooks/useBAQuery';
import { QuerySection } from '@/components/QuerySection';
import { TableSkeleton } from '@/components/skeleton';

export default function DevicesTablesSection() {
  const browserQuery = useBAQuery({
    queryKey: ['browser-breakdown'],
    queryFn: (dashboardId, query) => fetchBrowserBreakdownAction(dashboardId, query),
  });
  const osQuery = useBAQuery({
    queryKey: ['os-breakdown'],
    queryFn: (dashboardId, query) => fetchOperatingSystemBreakdownAction(dashboardId, query),
  });
  const t = useTranslations('components.devices.tables');

  if (browserQuery.isPending || osQuery.isPending) return <TableSkeleton />;

  return (
    <QuerySection loading={browserQuery.isFetching || osQuery.isFetching}>
      <div className='grid grid-cols-1 gap-3 xl:grid-cols-2'>
        <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
          <CardHeader className='px-0 pb-0'>
            <CardTitle className='text-base font-medium'>{t('topOperatingSystems')}</CardTitle>
          </CardHeader>
          <CardContent className='px-0'>
            <OperatingSystemTable data={osQuery.data!} />
          </CardContent>
        </Card>
        <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
          <CardHeader className='px-0 pb-0'>
            <CardTitle className='text-base font-medium'>{t('topBrowsers')}</CardTitle>
          </CardHeader>
          <CardContent className='px-0'>
            <BrowserTable data={browserQuery.data!} />
          </CardContent>
        </Card>
      </div>
    </QuerySection>
  );
}
