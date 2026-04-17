import React, { type Dispatch, type SetStateAction } from 'react';
import { type QueryFilter } from '@/entities/analytics/filter.entities';
import { useQueryFilters } from '@/hooks/use-query-filters';

type QueryFiltersContextProps = {
  queryFilters: QueryFilter[];
  addQueryFilter: Dispatch<QueryFilter | Omit<QueryFilter, 'id'>>;
  addEmptyQueryFilter: Dispatch<void>;
  removeQueryFilter: Dispatch<string>;
  updateQueryFilter: Dispatch<QueryFilter>;
  setQueryFilters: Dispatch<SetStateAction<QueryFilter[]>>;
};

const QueryFiltersContext = React.createContext<QueryFiltersContextProps>({} as QueryFiltersContextProps);

type QueryFiltersContextProviderProps = {
  children: React.ReactNode;
  initialQueryFilters?: QueryFilter[];
};

export function QueryFiltersContextProvider({ children, initialQueryFilters }: QueryFiltersContextProviderProps) {
  const localQueryFilters = useQueryFilters(initialQueryFilters);

  return <QueryFiltersContext.Provider value={localQueryFilters}>{children}</QueryFiltersContext.Provider>;
}

export function useQueryFiltersContext() {
  return React.useContext(QueryFiltersContext);
}
