'use client';

import { use } from 'react';
import ReferrerTable from '@/app/(protected)/dashboard/[dashboardId]/referrers/ReferrerTable';
import { fetchReferrerTableDataForSite } from '@/app/actions/index.actions';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

type ReferrersTableSectionProps = {
  referrerTablePromise: ReturnType<typeof fetchReferrerTableDataForSite>;
};

export default function ReferrersTableSection({ referrerTablePromise }: ReferrersTableSectionProps) {
  const tableResult = use(referrerTablePromise);
  const tableData = tableResult.data;
  const t = useTranslations('components.referrers.table');

  return (
    <Card variant='section' minHeight='chart'>
      <CardHeader>
        <CardTitle>{t('details')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ReferrerTable data={tableData} />
      </CardContent>
    </Card>
  );
}
