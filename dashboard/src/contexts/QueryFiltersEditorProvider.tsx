'use client';

import { createContext, useCallback, useContext, useMemo, useState, type Dispatch, type ReactNode } from 'react';
import { type QueryFilter } from '@/entities/analytics/filter.entities';

export type QueryFilterPart = 'column' | 'operator' | 'values';

export type QueryFiltersEditorTarget = {
  filterId: QueryFilter['id'];
  part: QueryFilterPart;
};

// What the editor focuses on open: a part of an existing filter, or a new empty row
export type QueryFiltersEditorFocus = QueryFiltersEditorTarget | { newFilter: true };

type QueryFiltersEditorState = {
  isOpen: boolean;
  target: QueryFiltersEditorFocus | null;
};

type QueryFiltersEditorContextValue = QueryFiltersEditorState & {
  setIsOpen: Dispatch<boolean>;
  openEditor: Dispatch<QueryFiltersEditorFocus>;
};

const QueryFiltersEditorContext = createContext<QueryFiltersEditorContextValue | undefined>(undefined);

export function QueryFiltersEditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QueryFiltersEditorState>({ isOpen: false, target: null });

  // The target outlives the close so focus can return to the pill section that opened the editor.
  const setIsOpen = useCallback(
    (open: boolean) => setState((current) => ({ isOpen: open, target: open ? null : current.target })),
    [],
  );
  const openEditor = useCallback((target: QueryFiltersEditorFocus) => setState({ isOpen: true, target }), []);

  const value = useMemo(() => ({ ...state, setIsOpen, openEditor }), [state, setIsOpen, openEditor]);

  return <QueryFiltersEditorContext.Provider value={value}>{children}</QueryFiltersEditorContext.Provider>;
}

export function useQueryFiltersEditor() {
  const context = useContext(QueryFiltersEditorContext);
  if (context === undefined) {
    throw new Error('useQueryFiltersEditor must be used within a QueryFiltersEditorProvider');
  }
  return context;
}
