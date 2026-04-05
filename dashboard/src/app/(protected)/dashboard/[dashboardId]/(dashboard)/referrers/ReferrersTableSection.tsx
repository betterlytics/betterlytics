'use client';

import ReferrerTable from './ReferrerTable';
import { fetchReferrerTableDataForSite } from '@/app/actions/index.actions';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBAQuery } from '@/hooks/useBAQuery';
import { QuerySection } from '@/components/QuerySection';
import { TableSkeleton } from '@/components/skeleton';

export default function ReferrersTableSection() {
  const query = useBAQuery({
    queryKey: ['referrer-table'],
    queryFn: (dashboardId, query) => fetchReferrerTableDataForSite(dashboardId, query, 100),
  });
  const t = useTranslations('components.referrers.table');

  return (
    <QuerySection query={query} fallback={<TableSkeleton />}>
      {(tableResult) => (
        <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
          <CardHeader className='px-0 pb-0'>
            <CardTitle className='text-base font-medium'>{t('details')}</CardTitle>
          </CardHeader>
          <CardContent className='px-0'>
            <ReferrerTable data={tableResult.data} />
          </CardContent>
        </Card>
      )}
    </QuerySection>
  );
}
