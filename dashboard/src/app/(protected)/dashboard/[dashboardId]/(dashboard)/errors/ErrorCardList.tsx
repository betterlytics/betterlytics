'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ErrorCard } from './ErrorCard';
import { fetchErrorGroupsPageAction, type ErrorGroupsPageResult } from '@/app/actions/analytics/errors.actions';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useTimeRangeQueryOptions } from '@/hooks/useTimeRangeQueryOptions';

type SortOption = 'events' | 'last_seen' | 'alphabetical';

type ErrorCardListProps = {
  initialPage: ErrorGroupsPageResult;
  dashboardId: string;
  pageSize: number;
};

export function ErrorCardList({ initialPage, dashboardId, pageSize }: ErrorCardListProps) {
  const query = useAnalyticsQuery();
  const { staleTime, gcTime, refetchOnWindowFocus } = useTimeRangeQueryOptions();
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('events');

  const { totalGroups, timeBuckets } = initialPage;
  const totalPages = Math.max(1, Math.ceil(totalGroups / pageSize));

  const initialPageRef = useRef(initialPage);
  useEffect(() => {
    if (initialPageRef.current !== initialPage) {
      initialPageRef.current = initialPage;
      setPageIndex(0);
    }
  }, [initialPage]);

  const { data, isFetching } = useQuery({
    queryKey: [
      'error-groups',
      dashboardId,
      query.startDate,
      query.endDate,
      query.granularity,
      query.timezone,
      query.queryFilters,
      pageIndex,
      pageSize,
    ],
    queryFn: () => fetchErrorGroupsPageAction(dashboardId, query, pageSize, pageIndex * pageSize, timeBuckets),
    initialData:
      pageIndex === 0 ? { errorGroups: initialPage.errorGroups, volumeMap: initialPage.volumeMap } : undefined,
    placeholderData: keepPreviousData,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
  });

  const errorGroups = data?.errorGroups ?? [];
  const volumeMap = data?.volumeMap ?? {};

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = errorGroups;

    if (q) {
      result = result.filter(
        (e) => e.error_type.toLowerCase().includes(q) || e.error_message.toLowerCase().includes(q),
      );
    }

    switch (sort) {
      case 'events':
        result = [...result].sort((a, b) => b.count - a.count);
        break;
      case 'last_seen':
        result = [...result].sort((a, b) => b.last_seen.getTime() - a.last_seen.getTime());
        break;
      case 'alphabetical':
        result = [...result].sort(
          (a, b) => a.error_type.localeCompare(b.error_type) || a.error_message.localeCompare(b.error_message),
        );
        break;
    }

    return result;
  }, [errorGroups, search, sort]);

  return (
    <div className='space-y-3'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div className='relative flex-1 sm:max-w-sm'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            type='text'
            placeholder='Search by type and message...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='events'>Most events</SelectItem>
            <SelectItem value='last_seen'>Last seen</SelectItem>
            <SelectItem value='alphabetical'>Alphabetically</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className='py-12 text-center'>
          <p className='text-muted-foreground text-sm'>
            {totalGroups === 0 ? 'No errors recorded in this period.' : 'No errors matching your search.'}
          </p>
        </div>
      ) : (
        <>
          <div className={`space-y-2 ${isFetching ? 'opacity-60' : ''}`}>
            {filtered.map((error) => (
              <ErrorCard
                key={error.error_fingerprint}
                error={error}
                volume={volumeMap[error.error_fingerprint] ?? []}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className='flex items-center justify-end gap-2 py-1'>
              <span className='text-muted-foreground text-xs'>
                {pageIndex + 1} / {totalPages}
              </span>
              <div className='flex items-center'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 cursor-pointer'
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex(pageIndex - 1)}
                  aria-label='Previous page'
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 cursor-pointer'
                  disabled={pageIndex === totalPages - 1}
                  onClick={() => setPageIndex(pageIndex + 1)}
                  aria-label='Next page'
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
