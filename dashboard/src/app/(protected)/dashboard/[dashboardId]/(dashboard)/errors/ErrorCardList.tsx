'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ErrorCard } from './ErrorCard';
import { ErrorsEmptyState } from './ErrorsEmptyState';
import { fetchErrorGroupVolumesAction } from '@/app/actions/analytics/errors.actions';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useTimeRangeQueryOptions } from '@/hooks/useTimeRangeQueryOptions';
import type { TimeSeriesPoint } from '@/presenters/toTimeSeries';
import type { ErrorGroupRow } from '@/entities/analytics/errors.entities';

type SortOption = 'occurrences' | 'last_seen' | 'first_seen' | 'alphabetical';

const PAGE_SIZE = 10;

type ErrorCardListProps = {
  hasAnyErrors: boolean;
  errorGroups: ErrorGroupRow[];
  initialVolumeMap: Record<string, TimeSeriesPoint[]>;
  timeBuckets: TimeSeriesPoint[];
  dashboardId: string;
};

export function ErrorCardList({ hasAnyErrors, errorGroups, initialVolumeMap, timeBuckets, dashboardId }: ErrorCardListProps) {
  if (!hasAnyErrors) {
    return <ErrorsEmptyState />;
  }

  return (
    <ErrorCardListInner
      errorGroups={errorGroups}
      initialVolumeMap={initialVolumeMap}
      timeBuckets={timeBuckets}
      dashboardId={dashboardId}
    />
  );
}

function ErrorCardListInner({ errorGroups, initialVolumeMap, timeBuckets, dashboardId }: Omit<ErrorCardListProps, 'hasAnyErrors'>) {
  const query = useAnalyticsQuery();
  const { staleTime, gcTime, refetchOnWindowFocus } = useTimeRangeQueryOptions();
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('occurrences');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = errorGroups;

    if (q) {
      result = result.filter(
        (e) => e.error_type.toLowerCase().includes(q) || e.error_message.toLowerCase().includes(q),
      );
    }

    switch (sort) {
      case 'occurrences':
        result = [...result].sort((a, b) => b.count - a.count);
        break;
      case 'last_seen':
        result = [...result].sort((a, b) => b.last_seen.getTime() - a.last_seen.getTime());
        break;
      case 'first_seen':
        result = [...result].sort((a, b) => {
          if (!a.first_seen && !b.first_seen) return 0;
          if (!a.first_seen) return 1;
          if (!b.first_seen) return -1;
          return b.first_seen.getTime() - a.first_seen.getTime();
        });
        break;
      case 'alphabetical':
        result = [...result].sort(
          (a, b) => a.error_type.localeCompare(b.error_type) || a.error_message.localeCompare(b.error_message),
        );
        break;
    }

    return result;
  }, [errorGroups, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const visibleGroups = filtered.slice(safePageIndex * PAGE_SIZE, (safePageIndex + 1) * PAGE_SIZE);
  const visibleFingerprints = visibleGroups.map((g) => g.error_fingerprint);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPageIndex(0);
  };

  const fingerprintKey = visibleFingerprints.join(',');
  const initialFingerprintKey = errorGroups.slice(0, PAGE_SIZE).map((g) => g.error_fingerprint).join(',');
  const isInitialPage = fingerprintKey === initialFingerprintKey;

  const { data: volumeMap } = useQuery({
    queryKey: ['error-group-volumes', dashboardId, query.startDate, query.endDate, query.granularity, query.timezone, query.queryFilters, fingerprintKey],
    queryFn: () => fetchErrorGroupVolumesAction(dashboardId, query, visibleFingerprints, timeBuckets),
    initialData: isInitialPage ? initialVolumeMap : undefined,
    enabled: visibleFingerprints.length > 0,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
  });

  return (
    <div className='space-y-3'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div className='relative flex-1 sm:max-w-sm'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            type='text'
            placeholder='Search by type and message...'
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className='pl-9'
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='occurrences'>Most occurrences</SelectItem>
            <SelectItem value='last_seen'>Last seen</SelectItem>
            <SelectItem value='first_seen'>First seen</SelectItem>
            <SelectItem value='alphabetical'>Alphabetically</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className='py-12 text-center'>
          <p className='text-muted-foreground text-sm'>
            {search.trim() ? 'No errors matching your search.' : 'No errors recorded in this period.'}
          </p>
        </div>
      ) : (
        <>
          <div className='space-y-2'>
            {visibleGroups.map((error) => (
              <ErrorCard
                key={error.error_fingerprint}
                error={error}
                volume={volumeMap?.[error.error_fingerprint] ?? []}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className='flex items-center justify-end gap-2 py-1'>
              <span className='text-muted-foreground text-xs'>
                {safePageIndex + 1} / {totalPages}
              </span>
              <div className='flex items-center'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 cursor-pointer'
                  disabled={safePageIndex === 0}
                  onClick={() => setPageIndex(safePageIndex - 1)}
                  aria-label='Previous page'
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-7 w-7 cursor-pointer'
                  disabled={safePageIndex === totalPages - 1}
                  onClick={() => setPageIndex(safePageIndex + 1)}
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
