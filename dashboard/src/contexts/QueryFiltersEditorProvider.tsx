'use client';

import { createContext, useCallback, useContext, useMemo, useState, type Dispatch, type ReactNode } from 'react';
import { type QueryFilter } from '@/entities/analytics/filter.entities';

export type QueryFilterPart = 'column' | 'operator' | 'values';

export type QueryFiltersEditorTarget = {
  filterId: QueryFilter['id'];
  part: QueryFilterPart;
};

type QueryFiltersEditorState = {
  isOpen: boolean;
  target: QueryFiltersEditorTarget | null;
};

type QueryFiltersEditorContextValue = QueryFiltersEditorState & {
  setIsOpen: Dispatch<boolean>;
  openEditor: Dispatch<QueryFiltersEditorTarget>;
};

const QueryFiltersEditorContext = createContext<QueryFiltersEditorContextValue | undefined>(undefined);

export function QueryFiltersEditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QueryFiltersEditorState>({ isOpen: false, target: null });

  // The target outlives the close so focus can return to the pill section that opened the editor.
  const setIsOpen = useCallback(
    (open: boolean) => setState((current) => ({ isOpen: open, target: open ? null : current.target })),
    [],
  );
  const openEditor = useCallback((target: QueryFiltersEditorTarget) => setState({ isOpen: true, target }), []);

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
