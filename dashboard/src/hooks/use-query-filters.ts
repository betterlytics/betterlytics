import { type QueryFilter } from '@/entities/analytics/filter';
import { generateTempId } from '@/utils/temporaryId';
import { useCallback, useState } from 'react';

export function useQueryFilters(initialFilters?: QueryFilter[]) {
  const [queryFilters, setQueryFilters] = useState<QueryFilter[]>(initialFilters || []);

  const addQueryFilter = useCallback((queryFilter: QueryFilter | Omit<QueryFilter, 'id'>) => {
    const filter = {
      ...queryFilter,
      id: 'id' in queryFilter ? queryFilter.id : generateTempId(),
    };
    setQueryFilters((filters) => [...filters, filter]);
  }, []);

  const addEmptyQueryFilter = useCallback(() => {
    addQueryFilter({ column: 'url', operator: '=', value: '' });
  }, [addQueryFilter]);

  const removeQueryFilter = useCallback((id: string) => {
    setQueryFilters((filters) => filters.filter((filter) => filter.id !== id));
  }, []);

  const updateQueryFilter = useCallback((queryFilter: QueryFilter) => {
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
