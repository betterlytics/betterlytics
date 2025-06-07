'use client';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { Badge } from '../ui/badge';
import { formatQueryFilter } from '@/utils/queryFilters';

export function ActiveQueryFilters() {
  const { queryFilters } = useQueryFiltersContext();

  return (
    <div className='flex w-full flex-wrap gap-1'>
      {queryFilters.map((filter) => (
        <Badge key={filter.id} variant='outline' className='text-muted-foreground px-2 py-1'>
          {formatQueryFilter(filter)}
        </Badge>
      ))}
    </div>
  );
}
