'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EventsTable } from './EventsTable';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { useQueryState } from '@/hooks/use-query-state';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const CUSTOM_EVENTS_LIMIT = 1000;

export default function EventsTableSection() {
  const { input, options } = useBAQueryParams();
  const query = trpc.events.customEventsOverview.useQuery({ ...input, limit: CUSTOM_EVENTS_LIMIT }, options);
  const { data, loading, refetching } = useQueryState(query);
  const t = useTranslations('components.events.table');

  const [searchInput, setSearchInput] = useState('');

  return (
    <Card className='border-border/50 overflow-hidden px-3 sm:px-6'>
      <CardHeader className='px-0'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <CardTitle className='flex items-center gap-3'>
            <span>{t('eventDetails')}</span>
            {data && data.length > 0 && (
              <Badge variant='secondary' className='text-xs font-normal'>
                {data.length} {data.length === 1 ? t('uniqueEvent') : t('uniqueEvents')}
              </Badge>
            )}
          </CardTitle>
          <div className='relative w-full sm:max-w-xs'>
            <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
            <Input
              type='text'
              placeholder={t('searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className='pl-9'
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-0'>
        <div className='relative'>
          {refetching && (
            <div className='absolute inset-0 z-10 flex items-center justify-center'>
              <Spinner />
            </div>
          )}
          <div className={cn(refetching && 'pointer-events-none opacity-60')}>
            <EventsTable data={data ?? []} loading={loading} globalFilter={searchInput} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
