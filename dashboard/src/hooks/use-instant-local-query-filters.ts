import { type QueryFilter } from '@/entities/filter';
import { generateTempId } from '@/utils/temporaryId';
import { useCallback, useState } from 'react';

/**
 * Query filters handlers with instant updates
 */
export function useInstantLocalQueryFilters() {
  const [queryFilters, setQueryFilters] = useState<QueryFilterWithId[]>([]);

  const addQueryFilter = useCallback((queryFilter: QueryFilter) => {
    const filter = {
      ...queryFilter,
      id: generateTempId(),
    };
    setQueryFilters((filters) => [...filters, filter]);
  }, []);

  const addEmptyQueryFilter = useCallback(() => {
    addQueryFilter({ column: 'url', operator: '=', value: '' });
  }, [addQueryFilter]);

  const removeQueryFilter = useCallback((id: string) => {
    setQueryFilters((filters) => filters.filter((filter) => filter.id !== id));
  }, []);

  const updateQueryFilter = useCallback((queryFilter: QueryFilterWithId) => {
    setQueryFilters((filters) =>
      filters.with(
        filters.findIndex((filter) => filter.id === queryFilter.id),
        queryFilter,
      ),
    );
  }, []);

  return {
    queryFilters,
    addQueryFilter,
    addEmptyQueryFilter,
    removeQueryFilter,
    updateQueryFilter,
    setQueryFilters,
  };
}

export type QueryFilterWithId = QueryFilter & {
  id: string;
};
