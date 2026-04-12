'use client';

import ReferrerTable from './ReferrerTable';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { QuerySection } from '@/components/QuerySection';
import { TableSkeleton } from '@/components/skeleton';

export default function ReferrersTableSection() {
  const { input, options } = useBAQueryParams();
  const query = trpc.referrers.table.useQuery(input, options);
  const t = useTranslations('components.referrers.table');

  return (
    <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
      <CardHeader className='px-0 pb-0'>
        <CardTitle className='text-base font-medium'>{t('details')}</CardTitle>
      </CardHeader>
      <CardContent className='px-0'>
        <QuerySection
          query={query}
          fallback={<TableSkeleton tableOnly className='mt-8 h-80' />}
          className='overflow-x-auto'
        >
          {(tableResult) => <ReferrerTable data={tableResult} />}
        </QuerySection>
      </CardContent>
    </Card>
  );
}
