'use client';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { Badge } from '../ui/badge';
import { formatQueryFilter } from '@/utils/queryFilters';
import { XIcon } from 'lucide-react';

export function ActiveQueryFilters() {
  const { queryFilters, removeQueryFilter } = useQueryFiltersContext();

  if (queryFilters.length === 0) {
    return null;
  }
  return (
    <div className='flex flex-wrap gap-1'>
      {queryFilters.map((filter) => (
        <Badge key={filter.id} variant='outline' className='text-muted-foreground px-2 py-1'>
          {formatQueryFilter(filter)}
          <div className='mt-0.5 size-3.5' onClick={() => removeQueryFilter(filter.id)}>
            <XIcon className='size-full' />
          </div>
        </Badge>
      ))}
    </div>
  );
}
