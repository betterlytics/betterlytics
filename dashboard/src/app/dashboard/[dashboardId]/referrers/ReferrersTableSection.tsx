'use client';

import { use } from 'react';
import ReferrerTable from '@/app/dashboard/[dashboardId]/referrers/ReferrerTable';
import { fetchReferrerTableDataForSite } from '@/app/actions';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ReferrersTableSectionProps = {
  referrerTablePromise: ReturnType<typeof fetchReferrerTableDataForSite>;
};

export default function ReferrersTableSection({ referrerTablePromise }: ReferrersTableSectionProps) {
  const tableResult = use(referrerTablePromise);
  const tableData = tableResult.data;
  const t = useTranslations('components.referrers.table');

  return (
    <Card className='border-border flex min-h-[300px] flex-col gap-1 p-2 sm:min-h-[400px] sm:px-6 sm:pt-3'>
      <CardHeader className='px-0 pb-0'>
        <CardTitle className='text-lg font-medium'>{t('details')}</CardTitle>
      </CardHeader>
      <CardContent className='px-0'>
        <ReferrerTable data={tableData} />
      </CardContent>
    </Card>
  );
}
