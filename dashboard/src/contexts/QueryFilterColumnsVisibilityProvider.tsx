'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { type TableFilterColumn } from '@/entities/analytics/filter.entities';
import { type PropertySourceKind } from '@/entities/analytics/propertySources';

export type QueryFilterColumnsMode = 'disable' | 'hide';

/* A table column, or a whole property source (e.g. 'cep' on pages without custom events). */
export type ExcludableFilterColumn = TableFilterColumn | PropertySourceKind;

type QueryFilterColumnsVisibility = {
  excluded: ReadonlySet<ExcludableFilterColumn>;
  mode: QueryFilterColumnsMode;
};

const QueryFilterColumnsVisibilityContext = createContext<QueryFilterColumnsVisibility>({
  excluded: new Set<ExcludableFilterColumn>(),
  mode: 'disable',
});

type QueryFilterColumnsVisibilityProviderProps = {
  exclude?: ExcludableFilterColumn[];
  mode?: QueryFilterColumnsMode;
  children: ReactNode;
};

/**
 * Declares which filter columns do not apply to the current page. Excluded columns are
 * disabled in the filter column dropdown with a "not available" hint (mode 'disable',
 * the default) or left out of it entirely (mode 'hide'). Either way, existing filters
 * on them render disabled (but deletable) and are excluded from the analytics query -
 * while staying in the URL so they re-activate automatically on pages where the column
 * is available.
 */
export function QueryFilterColumnsVisibilityProvider({
  exclude,
  mode = 'disable',
  children,
}: QueryFilterColumnsVisibilityProviderProps) {
  const value = useMemo(() => ({ excluded: new Set<ExcludableFilterColumn>(exclude), mode }), [exclude, mode]);
  return (
    <QueryFilterColumnsVisibilityContext.Provider value={value}>
      {children}
    </QueryFilterColumnsVisibilityContext.Provider>
  );
}

export function useQueryFilterColumnsVisibility(): QueryFilterColumnsVisibility {
  return useContext(QueryFilterColumnsVisibilityContext);
}
