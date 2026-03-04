'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ErrorCard } from './ErrorCard';
import type { ErrorGroupRow } from '@/entities/analytics/errors.entities';
import type { BarChartPoint } from '@/presenters/toBarChart';

type SortOption = 'events' | 'last_seen' | 'alphabetical';

type ErrorCardListProps = {
  errors: ErrorGroupRow[];
  volumeMap: Record<string, BarChartPoint[]>;
};

export function ErrorCardList({ errors, volumeMap }: ErrorCardListProps) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('events');

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    let result = errors;

    if (query) {
      result = result.filter(
        (e) =>
          e.error_type.toLowerCase().includes(query) ||
          e.error_message.toLowerCase().includes(query),
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
        result = [...result].sort((a, b) => a.error_type.localeCompare(b.error_type) || a.error_message.localeCompare(b.error_message));
        break;
    }

    return result;
  }, [errors, search, sort]);

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
            {errors.length === 0 ? 'No errors recorded in this period.' : 'No errors matching your search.'}
          </p>
        </div>
      ) : (
        <div className='space-y-2'>
          {filtered.map((error) => (
            <ErrorCard
              key={error.error_fingerprint}
              error={error}
              volume={volumeMap[error.error_fingerprint] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
