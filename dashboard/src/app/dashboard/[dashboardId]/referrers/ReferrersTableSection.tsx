'use client';

import { use } from 'react';
import ReferrerTable from '@/app/dashboard/[dashboardId]/referrers/ReferrerTable';
import { fetchReferrerTableDataForSite } from '@/app/actions';
import { useTranslations } from 'next-intl';

type ReferrersTableSectionProps = {
  referrerTablePromise: ReturnType<typeof fetchReferrerTableDataForSite>;
};

export default function ReferrersTableSection({ referrerTablePromise }: ReferrersTableSectionProps) {
  const tableResult = use(referrerTablePromise);
  const tableData = tableResult.data;
  const t = useTranslations('components.referrers.table');

  return (
    <div className='bg-card border-border rounded-xl border px-3 py-4 shadow sm:px-6'>
      <div className='text-foreground mb-2 px-0 text-base font-medium'>{t('details')}</div>
      <ReferrerTable data={tableData} />
    </div>
  );
}
