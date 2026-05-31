'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_FILTER_COLUMN_VISIBILITY } from '@/components/filters/filterColumnOptions';
import { type TableFilterColumn } from '@/entities/analytics/filter.entities';

const QueryFilterColumnsVisibilityContext = createContext<Record<TableFilterColumn, boolean>>(
  DEFAULT_FILTER_COLUMN_VISIBILITY,
);

type QueryFilterColumnsVisibilityProviderProps = {
  show?: Partial<Record<TableFilterColumn, boolean>>;
  children: ReactNode;
};

export function QueryFilterColumnsVisibilityProvider({
  show,
  children,
}: QueryFilterColumnsVisibilityProviderProps) {
  const visibility = useMemo(() => ({ ...DEFAULT_FILTER_COLUMN_VISIBILITY, ...show }), [show]);
  return (
    <QueryFilterColumnsVisibilityContext.Provider value={visibility}>
      {children}
    </QueryFilterColumnsVisibilityContext.Provider>
  );
}

export function useQueryFilterColumnsVisibility(): Record<TableFilterColumn, boolean> {
  return useContext(QueryFilterColumnsVisibilityContext);
}
