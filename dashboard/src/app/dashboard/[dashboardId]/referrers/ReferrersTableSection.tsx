'use client';

import { use } from 'react';
import ReferrerTable from '@/app/dashboard/[dashboardId]/referrers/ReferrerTable';
import { fetchReferrerTableDataForSite } from '@/app/actions';
import { useDictionary } from '@/contexts/DictionaryContextProvider';

type ReferrersTableSectionProps = {
  referrerTablePromise: ReturnType<typeof fetchReferrerTableDataForSite>;
};

export default function ReferrersTableSection({ referrerTablePromise }: ReferrersTableSectionProps) {
  const tableResult = use(referrerTablePromise);
  const tableData = tableResult.data;
  const { dictionary } = useDictionary();

  return (
    <div className='bg-card border-border rounded-lg border p-4 shadow'>
      <div className='text-foreground mb-2 font-medium'>{dictionary.t('components.referrers.table.details')}</div>
      <p className='text-muted-foreground mb-4 text-xs'>{dictionary.t('components.referrers.table.detailsDescription')}</p>
      <ReferrerTable data={tableData} />
    </div>
  );
}
