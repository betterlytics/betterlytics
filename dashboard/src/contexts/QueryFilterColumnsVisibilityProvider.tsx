'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_FILTER_COLUMN_VISIBILITY } from '@/components/filters/filterColumnOptions';
import { type TableFilterColumn } from '@/entities/analytics/filter.entities';
import { type ShowProp } from '@/types/component';

const QueryFilterColumnsVisibilityContext = createContext<ShowProp<TableFilterColumn>>({});

type QueryFilterColumnsVisibilityProviderProps = {
  show?: ShowProp<TableFilterColumn>;
  children: ReactNode;
};

export function QueryFilterColumnsVisibilityProvider({
  show,
  children,
}: QueryFilterColumnsVisibilityProviderProps) {
  return (
    <QueryFilterColumnsVisibilityContext.Provider value={show ?? {}}>
      {children}
    </QueryFilterColumnsVisibilityContext.Provider>
  );
}

export function useQueryFilterColumnsVisibility(
  override?: ShowProp<TableFilterColumn>,
): Record<TableFilterColumn, boolean> {
  const context = useContext(QueryFilterColumnsVisibilityContext);
  return useMemo(() => ({ ...DEFAULT_FILTER_COLUMN_VISIBILITY, ...context, ...override }), [context, override]);
}
