'use client';

import ReferrerTable from './ReferrerTable';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';

export default function ReferrersTableSection() {
  const { input, options } = useBAQueryParams();
  const query = trpc.referrers.table.useQuery(input, options);
  const t = useTranslations('components.referrers.table');

  const { data, loading, refetching } = useQueryState(query);

  return (
    <Card className='border-border flex min-h-[300px] flex-col gap-1 p-3 sm:min-h-[400px] sm:px-6 sm:pt-4 sm:pb-4'>
      <CardHeader className='px-0 pb-0'>
        <CardTitle className='text-base font-medium'>{t('details')}</CardTitle>
      </CardHeader>
      <CardContent className='overflow-x-auto px-0'>
        <div className='relative'>
          {refetching && (
            <div className='absolute inset-0 z-10 flex items-center justify-center'>
              <Spinner />
            </div>
          )}
          <div className={cn(refetching && 'pointer-events-none opacity-60')}>
            <ReferrerTable data={data} loading={loading} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
