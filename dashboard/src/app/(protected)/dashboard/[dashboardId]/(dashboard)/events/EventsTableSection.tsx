'use client';

import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventsTable } from './EventsTable';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export default function EventsTableSection() {
  const { input, options } = useBAQueryParams();
  const query = trpc.events.customEventsOverview.useQuery(input, options);
  const { data, loading, refetching } = useQueryState(query);
  const t = useTranslations('components.events.table');

  return (
    <Card className='border-border/50 overflow-hidden px-3 sm:px-6'>
      <CardHeader className='px-0'>
        <CardTitle className='flex items-center gap-3'>
          <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg'>
            <Activity className='text-primary h-4 w-4' />
          </div>
          <div className='flex items-center gap-3'>
            <span>{t('eventDetails')}</span>
            {data && data.length > 0 && (
              <Badge variant='secondary' className='text-xs font-normal'>
                {data.length} {data.length === 1 ? t('uniqueEvent') : t('uniqueEvents')}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className='px-0'>
        <div className='relative'>
          {refetching && (
            <div className='absolute inset-0 z-10 flex items-center justify-center'>
              <Spinner />
            </div>
          )}
          <div className={cn(refetching && 'pointer-events-none opacity-60')}>
            <EventsTable data={data ?? []} loading={loading} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
