'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
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
  setIsOpen: (open: boolean) => void;
  openEditor: (target: QueryFiltersEditorTarget) => void;
};

const QueryFiltersEditorContext = createContext<QueryFiltersEditorContextValue | undefined>(undefined);

export function QueryFiltersEditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QueryFiltersEditorState>({ isOpen: false, target: null });

  const setIsOpen = useCallback((open: boolean) => setState({ isOpen: open, target: null }), []);
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
