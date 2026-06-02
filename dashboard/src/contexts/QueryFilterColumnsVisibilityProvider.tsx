'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { type TableFilterColumn } from '@/entities/analytics/filter.entities';

const QueryFilterColumnsHiddenContext = createContext<ReadonlySet<TableFilterColumn>>(
  new Set<TableFilterColumn>(),
);

type QueryFilterColumnsVisibilityProviderProps = {
  hide?: TableFilterColumn[];
  children: ReactNode;
};

/**
 * Declares which filter columns do not apply to the current page. Hidden columns are not
 * offered in the filter dropdowns, existing filters on them render disabled (but deletable),
 * and they are excluded from the analytics query - while staying in the URL so they
 * re-activate automatically on pages where the column is available.
 */
export function QueryFilterColumnsVisibilityProvider({
  hide,
  children,
}: QueryFilterColumnsVisibilityProviderProps) {
  const hidden = useMemo(() => new Set<TableFilterColumn>(hide), [hide]);
  return (
    <QueryFilterColumnsHiddenContext.Provider value={hidden}>{children}</QueryFilterColumnsHiddenContext.Provider>
  );
}

export function useHiddenQueryFilterColumns(): ReadonlySet<TableFilterColumn> {
  return useContext(QueryFilterColumnsHiddenContext);
}
