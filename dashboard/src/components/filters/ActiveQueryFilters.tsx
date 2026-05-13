'use client';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { Badge } from '@/components/ui/badge';
import { XIcon } from 'lucide-react';
import { FilterDescription } from '@/components/filters/FilterDescription';

export function ActiveQueryFilters() {
  const { queryFilters, removeQueryFilter } = useQueryFiltersContext();

  if (queryFilters.length === 0) {
    return null;
  }
  return (
    <div className='flex flex-wrap gap-1 sm:justify-end'>
      {queryFilters.map((filter) => (
        <Badge
          key={filter.id}
          variant='outline'
          className='border-input bg-muted/50 hover:bg-muted/70 dark:bg-secondary dark:hover:bg-secondary/90 px-2 py-1'
        >
          <FilterDescription filter={filter} />
          <div
            className='text-muted-foreground mt-0.5 size-3.5 cursor-pointer opacity-80 hover:opacity-100'
            onClick={() => removeQueryFilter(filter.id)}
          >
            <XIcon className='size-full' />
          </div>
        </Badge>
      ))}
    </div>
  );
}
